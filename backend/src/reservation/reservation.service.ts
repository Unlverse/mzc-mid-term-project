import { BadRequestException, ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { compare, hash } from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { CancelReservationDto } from './dto/cancel-reservation.dto';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { LookupReservationDto } from './dto/lookup-reservation.dto';
import { UpdateReservationStatusDto } from './dto/update-reservation-status.dto';

@Injectable()
export class ReservationService {
  constructor(private readonly prismaService: PrismaService) {}

  async getAvailableTimes(date: string) {
    const reservationDate = this.parseDate(date);
    this.assertDateWithinCurrentMonth(reservationDate);
    const settings = await this.getReservationSettingsEntity();
    const times = this.buildTimeSlots(
      settings.reservationStartTime,
      settings.reservationEndTime,
      settings.slotIntervalMinutes,
    );

    const reservations = await this.prismaService.reservation.findMany({
      where: {
        reservationDate,
        status: 'CONFIRMED',
      },
      select: {
        reservationTime: true,
      },
    });

    const reservedCountMap = reservations.reduce<Record<string, number>>((acc, reservation) => {
      acc[reservation.reservationTime] = (acc[reservation.reservationTime] ?? 0) + 1;
      return acc;
    }, {});

    return {
      date,
      slotIntervalMinutes: settings.slotIntervalMinutes,
      slotCapacity: settings.slotCapacity,
      times: times.map((time) => {
        const reservedCount = reservedCountMap[time] ?? 0;
        const remainingCount = Math.max(settings.slotCapacity - reservedCount, 0);

        return {
          time,
          reservedCount,
          available: remainingCount > 0,
          remainingCount,
        };
      }),
    };
  }

  async createReservation(dto: CreateReservationDto) {
    const reservationDate = this.parseDate(dto.reservationDate);
    this.assertDateWithinCurrentMonth(reservationDate);
    const reservationDateTime = this.parseDateTime(dto.reservationDate, dto.reservationTime);

    if (reservationDateTime.getTime() <= Date.now()) {
      throw new BadRequestException('Reservation time must be in the future.');
    }

    const settings = await this.getReservationSettingsEntity();
    const timeSlots = this.buildTimeSlots(
      settings.reservationStartTime,
      settings.reservationEndTime,
      settings.slotIntervalMinutes,
    );

    if (!timeSlots.includes(dto.reservationTime)) {
      throw new BadRequestException('Invalid reservation time.');
    }

    const existingCount = await this.prismaService.reservation.count({
      where: {
        reservationDate,
        reservationTime: dto.reservationTime,
        status: 'CONFIRMED',
      },
    });

    if (existingCount >= settings.slotCapacity) {
      throw new ConflictException('Reservation slot is full.');
    }

    const temporaryPassword = this.generateTemporaryPassword();
    const temporaryPasswordHash = await hash(temporaryPassword, 10);

    const result = await this.prismaService.$transaction(async (tx) => {
      const existingSequence = await tx.reservationDailySequence.findUnique({
        where: { sequenceDate: reservationDate },
      });

      const sequence = existingSequence
        ? await tx.reservationDailySequence.update({
            where: { sequenceDate: reservationDate },
            data: { lastSequence: { increment: 1 } },
          })
        : await tx.reservationDailySequence.create({
            data: {
              sequenceDate: reservationDate,
              lastSequence: 1,
            },
          });

      const reservationNumber = `${dto.reservationDate.replace(/-/g, '')}${String(sequence.lastSequence).padStart(4, '0')}`;

      const reservation = await tx.reservation.create({
        data: {
          reservationNumber,
          reservationDate,
          reservationTime: dto.reservationTime,
          customerName: dto.customerName,
          customerPhone: dto.customerPhone,
          partySize: dto.partySize,
          temporaryPasswordHash,
          status: 'CONFIRMED',
        },
      });

      return { reservation, reservationNumber };
    });

    return this.toReservationDetail(result.reservation, temporaryPassword);
  }

  async lookupReservation(dto: LookupReservationDto) {
    const reservation = await this.findReservationByLookup(dto);

    return this.toReservationDetail(reservation);
  }

  async cancelReservation(dto: CancelReservationDto) {
    const reservation = await this.findReservationByLookup(dto);

    if (reservation.status !== 'CONFIRMED') {
      throw new ConflictException('Reservation cannot be canceled.');
    }

    const reservationDateString = reservation.reservationDate.toISOString().slice(0, 10);
    const reservationDateTime = this.parseDateTime(
      reservationDateString,
      reservation.reservationTime,
    );

    if (reservationDateTime.getTime() <= Date.now()) {
      throw new ConflictException('Past reservations cannot be canceled.');
    }

    const canceledReservation = await this.prismaService.reservation.update({
      where: { id: reservation.id },
      data: {
        status: 'CANCELED',
        canceledAt: new Date(),
      },
    });

    return {
      reservationId: Number(canceledReservation.id),
      reservationNumber: canceledReservation.reservationNumber,
      status: canceledReservation.status,
    };
  }

  async getReservationSettings() {
    const settings = await this.getReservationSettingsEntity();

    return {
      id: Number(settings.id),
      reservationStartTime: settings.reservationStartTime,
      reservationEndTime: settings.reservationEndTime,
      slotIntervalMinutes: settings.slotIntervalMinutes,
      slotCapacity: settings.slotCapacity,
      createdAt: settings.createdAt,
      updatedAt: settings.updatedAt,
    };
  }

  async updateReservationSettings(payload: Record<string, unknown>) {
    const settings = await this.getReservationSettingsEntity();
    const normalized = this.normalizeReservationSettingsPayload(payload, settings);

    const updatedSettings = await this.prismaService.reservationSetting.update({
      where: { id: settings.id },
      data: normalized,
    });

    return {
      id: Number(updatedSettings.id),
      reservationStartTime: updatedSettings.reservationStartTime,
      reservationEndTime: updatedSettings.reservationEndTime,
      slotIntervalMinutes: updatedSettings.slotIntervalMinutes,
      slotCapacity: updatedSettings.slotCapacity,
      createdAt: updatedSettings.createdAt,
      updatedAt: updatedSettings.updatedAt,
    };
  }

  async getAdminReservations(filters: { date?: string; status?: string }) {
    const where: {
      reservationDate?: Date;
      status?: 'CONFIRMED' | 'CANCELED' | 'ARRIVED' | 'NO_SHOW';
    } = {};

    if (filters.date) {
      where.reservationDate = this.parseDate(filters.date);
    }

    if (filters.status) {
      if (!['CONFIRMED', 'CANCELED', 'ARRIVED', 'NO_SHOW'].includes(filters.status)) {
        throw new BadRequestException('Invalid reservation status filter.');
      }

      where.status = filters.status as 'CONFIRMED' | 'CANCELED' | 'ARRIVED' | 'NO_SHOW';
    }

    const reservations = await this.prismaService.reservation.findMany({
      where,
      orderBy: [{ reservationDate: 'asc' }, { reservationTime: 'asc' }, { createdAt: 'asc' }],
    });

    return {
      items: reservations.map((reservation) => this.toReservationDetail(reservation)),
    };
  }

  async updateReservationStatus(reservationId: string, dto: UpdateReservationStatusDto) {
    const parsedReservationId = this.parseBigInt(reservationId);
    const reservation = await this.prismaService.reservation.findUnique({
      where: { id: parsedReservationId },
    });

    if (!reservation) {
      throw new NotFoundException('Reservation not found.');
    }

    if (reservation.status !== 'CONFIRMED') {
      throw new ConflictException('Reservation status cannot be changed.');
    }

    const now = new Date();
    const updatedReservation = await this.prismaService.reservation.update({
      where: { id: parsedReservationId },
      data: {
        status: dto.status,
        arrivedAt: dto.status === 'ARRIVED' ? now : reservation.arrivedAt,
        noShowAt: dto.status === 'NO_SHOW' ? now : reservation.noShowAt,
      },
    });

    return {
      id: Number(updatedReservation.id),
      status: updatedReservation.status,
    };
  }

  private async getReservationSettingsEntity() {
    const settings = await this.prismaService.reservationSetting.findFirst({
      orderBy: { id: 'asc' },
    });

    if (!settings) {
      throw new NotFoundException('Reservation settings not found.');
    }

    return settings;
  }

  private normalizeReservationSettingsPayload(
    payload: Record<string, unknown>,
    fallback: {
      reservationStartTime: string;
      reservationEndTime: string;
      slotIntervalMinutes: number;
      slotCapacity: number;
    },
  ) {
    const reservationStartTime = this.normalizeTimeValue(
      payload.reservationStartTime,
      fallback.reservationStartTime,
      'reservationStartTime',
    );
    const reservationEndTime = this.normalizeTimeValue(
      payload.reservationEndTime,
      fallback.reservationEndTime,
      'reservationEndTime',
    );
    const slotIntervalMinutes = this.normalizeIntegerValue(
      payload.slotIntervalMinutes,
      fallback.slotIntervalMinutes,
      'slotIntervalMinutes',
      1,
      Number.MAX_SAFE_INTEGER,
    );
    const slotCapacity = this.normalizeIntegerValue(
      payload.slotCapacity,
      fallback.slotCapacity,
      'slotCapacity',
      1,
      50,
    );

    return {
      reservationStartTime,
      reservationEndTime,
      slotIntervalMinutes,
      slotCapacity,
    };
  }

  private normalizeTimeValue(value: unknown, fallback: string, fieldName: string) {
    const nextValue = typeof value === 'string' && value.trim() ? value.trim() : fallback;

    if (!/^\d{2}:\d{2}$/.test(nextValue)) {
      throw new BadRequestException(`${fieldName} must be in HH:mm format.`);
    }

    return nextValue;
  }

  private normalizeIntegerValue(
    value: unknown,
    fallback: number,
    fieldName: string,
    min: number,
    max: number,
  ) {
    const nextValue = value === undefined || value === null || value === '' ? fallback : Number(value);

    if (!Number.isInteger(nextValue)) {
      throw new BadRequestException(`${fieldName} must be an integer number.`);
    }

    if (nextValue < min || nextValue > max) {
      throw new BadRequestException(`${fieldName} must be between ${min} and ${max}.`);
    }

    return nextValue;
  }

  private async findReservationByLookup(dto: LookupReservationDto) {
    const reservation = await this.prismaService.reservation.findUnique({
      where: { reservationNumber: dto.reservationNumber },
    });

    if (!reservation) {
      throw new NotFoundException('Reservation not found.');
    }

    if (reservation.customerPhone !== dto.customerPhone) {
      throw new UnauthorizedException('Invalid lookup credentials.');
    }

    const isPasswordValid = await compare(
      dto.temporaryPassword,
      reservation.temporaryPasswordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid lookup credentials.');
    }

    return reservation;
  }

  private toReservationDetail(
    reservation: {
      id: bigint;
      reservationNumber: string;
      reservationDate: Date;
      reservationTime: string;
      customerName: string;
      customerPhone: string;
      partySize: number;
      status: string;
    },
    temporaryPassword?: string,
  ) {
    return {
      reservationId: Number(reservation.id),
      reservationNumber: reservation.reservationNumber,
      ...(temporaryPassword ? { temporaryPassword } : {}),
      status: reservation.status,
      reservationDate: reservation.reservationDate.toISOString().slice(0, 10),
      reservationTime: reservation.reservationTime,
      customerName: reservation.customerName,
      customerPhone: reservation.customerPhone,
      partySize: reservation.partySize,
    };
  }

  private parseBigInt(value: string) {
    if (!/^\d+$/.test(value)) {
      throw new BadRequestException('Invalid identifier.');
    }

    return BigInt(value);
  }

  private parseDate(value: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      throw new BadRequestException('Invalid date format.');
    }

    const date = new Date(`${value}T00:00:00.000Z`);

    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException('Invalid date.');
    }

    return date;
  }

  private assertDateWithinCurrentMonth(date: Date) {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    if (date.getUTCFullYear() !== currentYear || date.getUTCMonth() !== currentMonth) {
      throw new BadRequestException('Reservations are only available for the current month.');
    }
  }

  private parseDateTime(date: string, time: string) {
    if (!/^\d{2}:\d{2}$/.test(time)) {
      throw new BadRequestException('Invalid time format.');
    }

    const dateTime = new Date(`${date}T${time}:00`);

    if (Number.isNaN(dateTime.getTime())) {
      throw new BadRequestException('Invalid reservation datetime.');
    }

    return dateTime;
  }

  private buildTimeSlots(startTime: string, endTime: string, intervalMinutes: number) {
    const start = this.timeToMinutes(startTime);
    const end = this.timeToMinutes(endTime);

    if (start > end) {
      throw new BadRequestException('Reservation settings are invalid.');
    }

    const times: string[] = [];

    for (let current = start; current <= end; current += intervalMinutes) {
      times.push(this.minutesToTime(current));
    }

    return times;
  }

  private timeToMinutes(value: string) {
    if (!/^\d{2}:\d{2}$/.test(value)) {
      throw new BadRequestException('Invalid time format.');
    }

    const [hours, minutes] = value.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private minutesToTime(totalMinutes: number) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }

  private generateTemporaryPassword() {
    return Math.random().toString(36).slice(2, 8).toUpperCase();
  }
}
