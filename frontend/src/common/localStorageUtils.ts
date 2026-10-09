const ID_TOKEN_KEY = 'access_token';

export const getToken = (): string | null => {
  return localStorage.getItem(ID_TOKEN_KEY);
};

export const saveToken = (token: string) => {
  localStorage.setItem(ID_TOKEN_KEY, token);
};

export const destroyToken = (): void => {
  localStorage.removeItem(ID_TOKEN_KEY);
};

export default { getToken, saveToken, destroyToken };
