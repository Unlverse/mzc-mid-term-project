import { Body, Controller, Get, Param, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ReservationService } from './reservation.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { LookupReservationDto } from './dto/lookup-reservation.dto';
import { CancelReservationDto } from './dto/cancel-reservation.dto';
import { UpdateReservationStatusDto } from './dto/update-reservation-status.dto';

@Controller()
export class ReservationController {
  constructor(private readonly reservationService: ReservationService) {}

  @Get('reservations/available-times')
  getAvailableTimes(@Query('date') date: string) {
    return this.reservationService.getAvailableTimes(date);
  }

  @Post('reservations')
  createReservation(@Body() body: CreateReservationDto) {
    return this.reservationService.createReservation(body);
  }

  @Post('reservations/lookup')
  lookupReservation(@Body() body: LookupReservationDto) {
    return this.reservationService.lookupReservation(body);
  }

  @Post('reservations/cancel')
  cancelReservation(@Body() body: CancelReservationDto) {
    return this.reservationService.cancelReservation(body);
  }

  @UseGuards(JwtAuthGuard)
  @Get('admin/reservation-settings')
  getReservationSettings() {
    return this.reservationService.getReservationSettings();
  }

  @UseGuards(JwtAuthGuard)
  @Put('admin/reservation-settings')
  updateReservationSettings(@Body() body: Record<string, unknown> | null | undefined) {
    const payload = body && typeof body === 'object' ? body : {};
    return this.reservationService.updateReservationSettings(payload);
  }

  @UseGuards(JwtAuthGuard)
  @Get('admin/reservations')
  getAdminReservations(@Query('date') date?: string, @Query('status') status?: string) {
    return this.reservationService.getAdminReservations({ date, status });
  }

  @UseGuards(JwtAuthGuard)
  @Patch('admin/reservations/:reservationId/status')
  updateReservationStatus(
    @Param('reservationId') reservationId: string,
    @Body() body: UpdateReservationStatusDto,
  ) {
    return this.reservationService.updateReservationStatus(reservationId, body);
  }
}
