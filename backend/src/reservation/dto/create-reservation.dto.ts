import { IsDateString, IsInt, IsNotEmpty, IsString, Max, Min } from 'class-validator';

export class CreateReservationDto {
  @IsString()
  @IsNotEmpty()
  customerName!: string;

  @IsString()
  @IsNotEmpty()
  customerPhone!: string;

  @IsInt()
  @Min(1)
  @Max(10)
  partySize!: number;

  @IsDateString()
  reservationDate!: string;

  @IsString()
  @IsNotEmpty()
  reservationTime!: string;
}
