import { get } from './apiClient';

export const productApi = {
  getAll: (pageNum = 1, pageSize = 12) =>
    get('/products', { pageNum, pageSize }),
  getById: (id) => get(`/products/${id}`),
};
