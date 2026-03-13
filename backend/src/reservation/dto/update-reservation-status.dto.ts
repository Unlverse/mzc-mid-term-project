import { IsIn, IsString } from 'class-validator';

export class UpdateReservationStatusDto {
  @IsString()
  @IsIn(['ARRIVED', 'NO_SHOW'])
  status!: 'ARRIVED' | 'NO_SHOW';
}
