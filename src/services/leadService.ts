import api from "./api";

export const leadService = {
  analyze: async (description: string) => {
    const response = await api.post("/leads/analyze", { description });
    return response.data.data;
  },
};
