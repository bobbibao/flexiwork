import { HttpException, ValidationError, ValidationPipe } from '@nestjs/common';

const flatten = (errors: ValidationError[], parent = ''): Array<{ field: string; constraints: string[] }> =>
  errors.flatMap((e) => {
    const field = parent ? `${parent}.${e.property}` : e.property;
    const own = e.constraints ? [{ field, constraints: Object.keys(e.constraints) }] : [];
    return [...own, ...flatten(e.children ?? [], field)];
  });

/** DTO validation for /api/sn controllers: 400 { error, code: 'VALIDATION_FAILED', details }. */
export const snValidationPipe = new ValidationPipe({
  transform: true,
  whitelist: true,
  transformOptions: { enableImplicitConversion: true },
  exceptionFactory: (errors) =>
    new HttpException({ error: true, code: 'VALIDATION_FAILED', message: 'Invalid request', details: flatten(errors) }, 400),
});
