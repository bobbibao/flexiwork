import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as bodyParser from 'body-parser';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { FileLogger } from './shared/services/file-logger.service';
import { Logger, LoggerService } from '@nestjs/common';

async function main() {
  const environment = process.env.NODE_ENV || 'development';
  const isDeploymentEnvironment = ['staging', 'production'].includes(environment);
  let logger: LoggerService;

  // Setup logger based on environment
  if (isDeploymentEnvironment) {
    logger = new FileLogger();
  } else {
    logger = new Logger('main');
  }

  // Print env variables
  logger.log(`envFilePath: ${process.env.ENV_PATH}/${process.env.NODE_ENV}.env`);
  logger.log(`Env variables: ${JSON.stringify(process.env)}`);

  try {
    const app = await NestFactory.create(AppModule, {
      logger: isDeploymentEnvironment ? logger : ['log', 'error', 'warn', 'debug', 'verbose'],
    });
    const PORT = process.env.PORT;

    // Config body parser
    app.use(bodyParser.json({ limit: '500mb' }));
    app.use(bodyParser.urlencoded({ limit: '500mb', extended: true }));

    // Config Swagger
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Arch App')
      .setDescription('Arch API Documentation')
      .addBearerAuth()
      .setVersion('1.1')
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, document);

    // Start the NestJS application
    await app.listen(PORT, () => {
      logger.log(`${environment}, Server is running http://localhost:${PORT}\n Environment - ${environment}`);
    });
  } catch (error) {
    logger.error('Error during startup:', error);
  }
}
// Call the main function after all imports
main();
