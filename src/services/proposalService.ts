import api from "./api";

export const proposalService = {
  getProposals: async () => {
    const response = await api.get("/proposals");
    return response.data.data;
  },
  generate: async (proposalData: any) => {
    const response = await api.post("/proposals/generate", proposalData);
    return response.data.data;
  },
};
