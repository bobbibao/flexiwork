import { SetMetadata } from '@nestjs/common';

export const UseCamelCaseInterceptor = () => SetMetadata('useCamelCaseInterceptor', true);
