import api from "./api";

export const meetingService = {
  getMeetings: async () => {
    const response = await api.get("/meetings");
    return response.data.data;
  },
};
