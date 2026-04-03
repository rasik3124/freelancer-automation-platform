import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Calendar as CalendarIcon, Clock, Video, ExternalLink, Plus, MoreVertical } from "lucide-react";
import { Button } from "../components/ui/Button";
import api from "../services/api";

export const Meetings: React.FC = () => {
  const [meetings, setMeetings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMeetings = async () => {
      try {
        const response = await api.get("/meetings");
        setMeetings(response.data.data);
      } catch (error) {
        console.error("Failed to fetch meetings:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMeetings();
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-3xl font-display font-bold text-textPrimary">Meetings</h2>
          <p className="text-textMuted">Manage your upcoming client calls and syncs.</p>
        </div>
        <Button variant="primary" className="gap-2">
          <Plus className="h-4 w-4" />
          Schedule Meeting
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          [1, 2, 3].map(i => (
            <div key={i} className="h-48 animate-pulse rounded-card bg-surface/50 border border-border" />
          ))
        ) : (
          meetings.map((meeting, index) => (
            <motion.div
              key={meeting.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="group relative overflow-hidden rounded-card border border-border bg-surface/50 p-6 transition-all hover:border-accent/30 hover:bg-surface"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent">
                  <CalendarIcon className="h-6 w-6" />
                </div>
                <button className="text-textDisabled hover:text-textPrimary transition-colors">
                  <MoreVertical className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-6 space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-textPrimary">{meeting.title}</h3>
                  <p className="text-sm text-textMuted">with {meeting.clientName}</p>
                </div>

                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2 text-xs text-textDisabled">
                    <Clock className="h-3.5 w-3.5" />
                    {meeting.time} ({meeting.duration})
                  </div>
                  <div className="flex items-center gap-2 text-xs text-textDisabled">
                    <Video className="h-3.5 w-3.5" />
                    Zoom Call
                  </div>
                </div>

                <div className="pt-2">
                  <a
                    href={meeting.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-base px-4 py-2 text-xs font-bold text-textPrimary transition-colors hover:bg-elevated"
                  >
                    Join Meeting
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};
