import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString, Max, Min } from 'class-validator';

export class UpdateReservationSettingsDto {
  @IsString()
  @IsNotEmpty()
  reservationStartTime!: string;

  @IsString()
  @IsNotEmpty()
  reservationEndTime!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  slotIntervalMinutes!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  slotCapacity!: number;
}
