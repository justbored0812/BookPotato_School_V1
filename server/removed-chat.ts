import type { RequestHandler } from "express";

export const rejectRemovedChat: RequestHandler = (req, res, next) => {
  const path = req.originalUrl.split("?")[0];
  if (/^\/api\/(?:messages|direct-messages)(?:\/|$)/.test(path) ||
      /^\/api\/societies\/[^/]+\/(?:messages|chat|chat-rooms)(?:\/|$)/.test(path) || path === "/ws") {
    return res.status(410).json({ code: "CHAT_REMOVED", message: "Chat is no longer available." });
  }
  next();
};
