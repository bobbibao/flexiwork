import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { ProductController } from './controllers/product.controller';
import { ProductService } from './services/product.service';
import { ProductProvider } from './product.provider';
import { CacheService } from 'src/shared/services';

@Module({
  imports: [DatabaseModule],
  controllers: [ProductController],
  providers: [ProductService, CacheService, ...ProductProvider],
  exports: [ProductService],
})
export class ProductModule {}
