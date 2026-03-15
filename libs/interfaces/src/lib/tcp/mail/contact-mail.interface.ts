// import { ApiProperty } from "@nestjs/swagger";
// import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class ContactMailRequest {

    name: string;

    email: string;

    subject: string;

    content: string;

}