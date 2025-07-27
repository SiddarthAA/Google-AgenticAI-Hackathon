import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

export function IssueListOverlay({ issues, onIssueClick }) {
  return (
    <div className="absolute top-4 left-4 z-10">
      <ScrollArea className="h-72 w-60 bg-black/90 rounded-md border border-gray-800 shadow-md">
        <div className="p-4">
          <h4 className="mb-4 text-sm leading-none font-medium text-white">
            Issues in view
          </h4>
          {issues.length === 0 ? (
            <div className="text-sm text-gray-400">No issues here.</div>
          ) : (
            issues.map((issue, idx) => (
              <React.Fragment key={issue.title + idx}>
                <div
                  onClick={() => onIssueClick(issue)}
                  className="text-white text-sm cursor-pointer hover:underline hover:text-blue-400 transition"
                >
                  {issue.title}
                  <div className="text-xs text-gray-400">
                    {issue.description}
                  </div>
                </div>
                <Separator className="my-2 bg-gray-700" />
              </React.Fragment>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
