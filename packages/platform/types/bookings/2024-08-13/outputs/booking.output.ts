import { ApiProperty } from "@nestjs/swagger";
import { Expose, Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsTimeZone,
  IsUrl,
  ValidateNested,
} from "class-validator";

import type { BookingLanguageType } from "../inputs/language";
import { BookingLanguage } from "../inputs/language";

class Attendee {
  @ApiProperty({ type: String, example: "John Doe" })
  @IsString()
  @Expose()
  name!: string;

  @ApiProperty({ type: String, example: "America/New_York" })
  @IsTimeZone()
  @Expose()
  timeZone!: string;

  @ApiProperty({ enum: BookingLanguage, required: false, example: "en" })
  @IsEnum(BookingLanguage)
  @Expose()
  @IsOptional()
  language?: BookingLanguageType;

  @ApiProperty({ type: Boolean, example: false })
  @IsBoolean()
  @Expose()
  absent!: boolean;
}

export class SeatedAttendee extends Attendee {
  @ApiProperty({ type: String, example: "3be561a9-31f1-4b8e-aefc-9d9a085f0dd1" })
  @IsString()
  @Expose()
  seatUid!: string;

  @ApiProperty({
    type: Object,
    description:
      "Booking field responses consisting of an object with booking field slug as keys and user response as values.",
    example: { customField: "customValue" },
    required: false,
  })
  @IsObject()
  @Expose()
  bookingFieldsResponses!: Record<string, unknown>;
}

class Host {
  @ApiProperty({ type: Number, example: 1 })
  @IsInt()
  @Expose()
  id!: number;

  @ApiProperty({ type: String, example: "Jane Doe" })
  @IsString()
  @Expose()
  name!: string;

  @ApiProperty({ type: String, example: "America/Los_Angeles" })
  @IsTimeZone()
  @Expose()
  timeZone!: string;
}

class EventType {
  @ApiProperty({ type: Number, example: 1 })
  @IsInt()
  @Expose()
  id!: number;

  @ApiProperty({ type: String, example: "some-event" })
  @IsString()
  @Expose()
  slug!: string;
}

class BaseBookingOutput_2024_08_13 {
  @ApiProperty({ type: Number, example: 123 })
  @IsInt()
  @Expose()
  id!: number;

  @ApiProperty({ type: String, example: "booking_uid_123" })
  @IsString()
  @Expose()
  uid!: string;

  @ApiProperty({ type: String, example: "Consultation" })
  @IsString()
  @Expose()
  title!: string;

  @ApiProperty({ type: String, example: "Learn how to integrate scheduling into marketplace." })
  @IsString()
  @Expose()
  description!: string;

  @ApiProperty({ type: [Host] })
  @ValidateNested({ each: true })
  @Type(() => Host)
  @Expose()
  hosts!: Host[];

  @ApiProperty({ enum: ["cancelled", "accepted", "rejected", "pending"], example: "accepted" })
  @IsEnum(["cancelled", "accepted", "rejected", "pending"])
  @Expose()
  status!: "cancelled" | "accepted" | "rejected" | "pending";

  @ApiProperty({ type: String, required: false, example: "User requested cancellation" })
  @IsString()
  @IsOptional()
  @Expose()
  cancellationReason?: string;

  @ApiProperty({ type: String, required: false, example: "User rescheduled the event" })
  @IsString()
  @IsOptional()
  @Expose()
  reschedulingReason?: string;

  @ApiProperty({ type: String, required: false, example: "previous_uid_123" })
  @IsString()
  @IsOptional()
  @Expose()
  rescheduledFromUid?: string;

  @ApiProperty({ type: String, example: "2024-08-13T15:30:00Z" })
  @IsDateString()
  @Expose()
  start!: string;

  @ApiProperty({ type: String, example: "2024-08-13T16:30:00Z" })
  @IsDateString()
  @Expose()
  end!: string;

  @ApiProperty({ type: Number, example: 60 })
  @IsInt()
  @Expose()
  duration!: number;

  @ApiProperty({
    type: Number,
    example: 50,
    deprecated: true,
    description: "Deprecated - rely on 'eventType' object containing the id instead.",
  })
  @IsInt()
  @Expose()
  eventTypeId!: number;

  @ApiProperty({ type: EventType })
  @Type(() => EventType)
  @Expose()
  eventType!: EventType;

  @ApiProperty({
    type: String,
    required: false,
    description: "Deprecated - rely on 'location' field instead.",
    example: "https://example.com/recurring-meeting",
    deprecated: true,
  })
  @IsUrl()
  @IsOptional()
  @Expose()
  meetingUrl?: string;

  @ApiProperty({ type: String, required: false, example: "https://example.com/meeting" })
  @IsOptional()
  @Expose()
  location!: string;

  @ApiProperty({ type: Boolean, example: true })
  @IsBoolean()
  @Expose()
  absentHost!: boolean;
}

export class BookingOutput_2024_08_13 extends BaseBookingOutput_2024_08_13 {
  @ApiProperty({ type: [Attendee] })
  @ValidateNested({ each: true })
  @Type(() => Attendee)
  @Expose()
  attendees!: Attendee[];

  @ApiProperty({ type: [String], required: false, example: ["guest1@example.com", "guest2@example.com"] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @Expose()
  guests?: string[];

  @ApiProperty({
    type: Object,
    description:
      "Booking field responses consisting of an object with booking field slug as keys and user response as values.",
    example: { customField: "customValue" },
    required: false,
  })
  @IsObject()
  @Expose()
  bookingFieldsResponses!: Record<string, unknown>;
}

export class RecurringBookingOutput_2024_08_13 extends BookingOutput_2024_08_13 {
  @ApiProperty({ type: String, example: "recurring_uid_987" })
  @IsString()
  @Expose()
  recurringBookingUid!: string;

  @ApiProperty({
    type: Object,
    description:
      "Booking field responses consisting of an object with booking field slug as keys and user response as values.",
    example: { customField: "customValue" },
    required: false,
  })
  @IsObject()
  @Expose()
  bookingFieldsResponses!: Record<string, unknown>;
}

export class GetSeatedBookingOutput_2024_08_13 extends BaseBookingOutput_2024_08_13 {
  @ApiProperty({ type: [SeatedAttendee] })
  @ValidateNested({ each: true })
  @Type(() => SeatedAttendee)
  @Expose()
  attendees!: SeatedAttendee[];
}

export class GetRecurringSeatedBookingOutput_2024_08_13 extends BaseBookingOutput_2024_08_13 {
  @ApiProperty({ type: [SeatedAttendee] })
  @ValidateNested({ each: true })
  @Type(() => SeatedAttendee)
  @Expose()
  attendees!: SeatedAttendee[];

  @ApiProperty({ type: String, example: "recurring_uid_987" })
  @IsString()
  @Expose()
  recurringBookingUid!: string;
}

export class CreateSeatedBookingOutput_2024_08_13 extends GetSeatedBookingOutput_2024_08_13 {
  @ApiProperty({ type: String, example: "3be561a9-31f1-4b8e-aefc-9d9a085f0dd1" })
  @IsString()
  @Expose()
  seatUid!: string;
}

export class CreateRecurringSeatedBookingOutput_2024_08_13 extends GetRecurringSeatedBookingOutput_2024_08_13 {
  @ApiProperty({ type: String, example: "3be561a9-31f1-4b8e-aefc-9d9a085f0dd1" })
  @IsString()
  @Expose()
  seatUid!: string;
}
