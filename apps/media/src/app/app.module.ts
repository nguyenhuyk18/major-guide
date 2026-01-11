import { Module } from '@nestjs/common';
import { CloudinaryModule } from './modules/cloudinary/cloudinary.module';
import { ConfigModule } from '@nestjs/config';
import { CONFIGURATION, TConfiguration } from '../configuration';
import { AvartarModule } from './modules/avartar/avartar.module';

@Module({
  imports: [CloudinaryModule,
    AvartarModule,
    ConfigModule.forRoot({
      isGlobal: true,
      load: [() => CONFIGURATION]
    })
  ],
  controllers: [],
  providers: [],
})
export class AppModule {
  static CONFIGURATION: TConfiguration = CONFIGURATION
}
