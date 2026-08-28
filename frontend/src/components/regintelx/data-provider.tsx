"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  fetchRegIntelData,
  updateComplianceMapStatus,
} from "@/lib/regintelx/api";
import type {
  ComplianceMap,
  RegIntelData,
} from "@/lib/regintelx/types";

type BackendStatus = "Checking..." | "Connected" | "Unavailable";

type RegIntelContextValue = RegIntelData & {
  loading: boolean;
  backendStatus: BackendStatus;
  refreshData: () => Promise<void>;
  updateMapStatus: (mapId: string, status: string) => Promise<void>;
  metrics: {
    highImpactChanges: number;
    openActions: number;
    completedActions: number;
    urgentActions: number;
    overdueActions: number;
    averageRisk: number;
  };
};

const RegIntelContext = createContext<RegIntelContextValue | null>(null);

const emptyData: RegIntelData = {
  sources: [],
  regulations: [],
  maps: [],
  changes: [],
};

export function RegIntelProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<RegIntelData>(emptyData);
  const [loading, setLoading] = useState(true);
  const [backendStatus, setBackendStatus] =
    useState<BackendStatus>("Checking...");

  async function refreshData() {
    try {
      setLoading(true);
      setData(await fetchRegIntelData());
      setBackendStatus("Connected");
    } catch {
      setBackendStatus("Unavailable");
    } finally {
      setLoading(false);
    }
  }

  async function updateMapStatus(mapId: string, status: string) {
    try {
      const updatedMap = await updateComplianceMapStatus(mapId, status);

      setData((current) => ({
        ...current,
        maps: current.maps.map((map: ComplianceMap) =>
          map.id === mapId ? updatedMap : map
        ),
      }));
    } catch {
      alert("Failed to update compliance action.");
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refreshData();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const metrics = useMemo(() => {
    const now = Date.now();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;

    const highImpactChanges = data.changes.filter(
      (change) => change.impact_level?.toLowerCase() === "high"
    ).length;
    const openActions = data.maps.filter(
      (map) => map.status !== "completed"
    ).length;
    const completedActions = data.maps.filter(
      (map) => map.status === "completed"
    ).length;
    const overdueActions = data.maps.filter((map) => {
      if (map.status === "completed" || !map.due_date) {
        return false;
      }

      const dueDate = new Date(map.due_date).getTime();

      return !Number.isNaN(dueDate) && dueDate < now;
    }).length;
    const urgentActions = data.maps.filter((map) => {
      if (map.status === "completed") {
        return false;
      }

      const priority = map.priority?.toLowerCase();
      const dueDate = map.due_date ? new Date(map.due_date).getTime() : null;
      const dueSoon =
        dueDate !== null &&
        !Number.isNaN(dueDate) &&
        dueDate >= now &&
        dueDate - now <= sevenDays;

      return (
        priority === "high" ||
        priority === "critical" ||
        overdueActions > 0 ||
        dueSoon
      );
    }).length;
    const averageRisk = data.maps.length
      ? Math.round(
          data.maps.reduce(
            (sum, map) => sum + Number(map.risk_score || 0),
            0
          ) / data.maps.length
        )
      : 0;

    return {
      highImpactChanges,
      openActions,
      completedActions,
      urgentActions,
      overdueActions,
      averageRisk,
    };
  }, [data.changes, data.maps]);

  const value = useMemo(
    () => ({
      ...data,
      loading,
      backendStatus,
      refreshData,
      updateMapStatus,
      metrics,
    }),
    [data, loading, backendStatus, metrics]
  );

  return (
    <RegIntelContext.Provider value={value}>
      {children}
    </RegIntelContext.Provider>
  );
}

export function useRegIntel() {
  const context = useContext(RegIntelContext);

  if (!context) {
    throw new Error("useRegIntel must be used inside RegIntelProvider");
  }

  return context;
}
