import { Module } from "@nestjs/common";
import { PDFGeneratorService } from "./services/pdf-generator.service";
// import { JwtService } from "@nestjs/jwt";

@Module({
    imports: [],
    controllers: [],
    providers: [PDFGeneratorService],
    exports: [PDFGeneratorService]
})
export class PDFGeneratorModule { }