import { IsNotEmpty, IsString } from 'class-validator';

export class LookupReservationDto {
  @IsString()
  @IsNotEmpty()
  reservationNumber!: string;

  @IsString()
  @IsNotEmpty()
  customerPhone!: string;

  @IsString()
  @IsNotEmpty()
  temporaryPassword!: string;
}
