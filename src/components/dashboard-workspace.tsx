"use client";

import React, { useState, useCallback } from "react";
import { CreateLinkForm } from "@/components/create-link-form";
import {
  MyLinksSection,
  type DashboardStats,
} from "@/components/my-links-section";

export function DashboardWorkspace() {
  const [refreshSignal, setRefreshSignal] = useState(0);
  const [stats, setStats] = useState<DashboardStats>({
    totalLinks: 0,
    totalClicks: 0,
    activeLinks: 0,
    loading: true,
  });

  const handleLinkCreated = useCallback(() => {
    setRefreshSignal((s) => s + 1);
  }, []);

  const handleStatsUpdate = useCallback((nextStats: DashboardStats) => {
    setStats(nextStats);
  }, []);

  const handleFocusCreate = () => {
    const input = document.getElementById("destination-url") as HTMLInputElement | null;
    const section = document.getElementById("create-link-section");
    section?.scrollIntoView({ behavior: "smooth", block: "center" });
    if (input) {
      input.focus({ preventScroll: true });
    }
  };

  return (
    <>
      {/* Dashboard Heading */}
      <div className="workspace-header">
        <div className="workspace-heading-group">
          <h1 className="workspace-title">Dashboard</h1>
          <p className="workspace-subtitle">
            Shorten URLs, manage custom aliases, and monitor click performance.
          </p>
        </div>

        <button
          type="button"
          onClick={handleFocusCreate}
          className="btn btn-primary"
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.25"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Create short link
        </button>
      </div>

      {/* Analytics Summary */}
      <section className="kpi-grid" aria-label="Account summary metrics">
        <div className="kpi-card">
          <div className="kpi-card-top">
            <span className="kpi-label">Total Links</span>
            <span className="kpi-icon" aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
            </span>
          </div>
          <div className="kpi-value kpi-value--accent">
            {stats.loading ? "—" : stats.totalLinks}
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card-top">
            <span className="kpi-label">Active Links</span>
            <span className="kpi-icon" aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            </span>
          </div>
          <div className="kpi-value kpi-value--success">
            {stats.loading ? "—" : stats.activeLinks}
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card-top">
            <span className="kpi-label">Total Clicks</span>
            <span className="kpi-icon" aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
            </span>
          </div>
          <div className="kpi-value kpi-value--cyan">
            {stats.loading ? "—" : stats.totalClicks}
          </div>
        </div>
      </section>

      {/* Create Short Link */}
      <CreateLinkForm onLinkCreated={handleLinkCreated} />

      {/* Your Links */}
      <MyLinksSection
        refreshSignal={refreshSignal}
        hideStats
        onStatsUpdate={handleStatsUpdate}
      />
    </>
  );
}

