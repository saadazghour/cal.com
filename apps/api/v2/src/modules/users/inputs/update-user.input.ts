import { IsTimeFormat } from "@/modules/users/inputs/validators/is-time-format";
import { IsWeekStart } from "@/modules/users/inputs/validators/is-week-start";
import { IsNumber, IsOptional, IsString, IsTimeZone, Validate } from "class-validator";

export class UpdateUserInput {
  @IsString()
  @IsOptional()
  email?: string;

  @IsNumber()
  @IsOptional()
  @Validate(IsTimeFormat)
  timeFormat?: number;

  @IsNumber()
  @IsOptional()
  defaultScheduleId?: number;

  @IsString()
  @IsOptional()
  @Validate(IsWeekStart)
  weekStart?: string;

  @IsTimeZone()
  @IsOptional()
  timeZone?: string;
}
