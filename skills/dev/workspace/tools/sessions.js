"use strict";

function relatedSessions(sessions, identity) {
  const project = (identity.project || "").toLowerCase();
  const issues = new Set(identity.issueIds || []);
  return sessions.filter((session) => {
    if (session.project && session.project.toLowerCase() === project) return true;
    if (session.issue && issues.has(session.issue)) return true;
    return false;
  });
}

module.exports = { relatedSessions };
