import { resolveApiErrorMessage } from './api-message';

describe('resolveApiErrorMessage', () => {
  it('maps validation failed for avaliacao', () => {
    const message = resolveApiErrorMessage(
      {
        status: 400,
        error: {
          message: 'Validation failed',
          details: [{ field: 'sessaoId', messages: ['sessaoId must be a UUID'] }],
        },
      },
      'avaliacao',
    );

    expect(message).toContain('sessão');
  });

  it('maps conflict to friendly avaliacao message', () => {
    expect(resolveApiErrorMessage({ status: 409, error: {} }, 'avaliacao')).toContain('já avaliou');
  });

  it('maps known server message', () => {
    const message = resolveApiErrorMessage(
      {
        status: 400,
        error: { message: 'Você já enviou uma avaliação para este estabelecimento.' },
      },
      'avaliacao',
    );

    expect(message).toBe('Você já avaliou este estabelecimento.');
  });
});
