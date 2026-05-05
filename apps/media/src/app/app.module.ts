import { Module } from '@nestjs/common';
import { CloudinaryModule } from './modules/cloudinary/cloudinary.module';
import { ConfigModule } from '@nestjs/config';
import { CONFIGURATION, TConfiguration } from '../configuration';
import { AvartarModule } from './modules/avartar/avartar.module';
import { PostModule } from './modules/post/post.module';
import { MongoProvider } from '@common/configuration/mongo.config';

@Module({
  imports: [CloudinaryModule,
    AvartarModule,
    PostModule,
    ConfigModule.forRoot({
      isGlobal: true,
      load: [() => CONFIGURATION]
    }),
    MongoProvider
  ],
  controllers: [],
  providers: [],
})
export class AppModule {
  static CONFIGURATION: TConfiguration = CONFIGURATION
}
