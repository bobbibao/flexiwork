const ID_TOKEN_KEY = "access_token";

export const getToken = () => {
  return localStorage.getItem(ID_TOKEN_KEY);
};

export const saveToken = token => {
  localStorage.setItem(ID_TOKEN_KEY, token);
};

export const destroyToken = () => {
  localStorage.removeItem(ID_TOKEN_KEY);
};

export default { getToken, saveToken, destroyToken };
