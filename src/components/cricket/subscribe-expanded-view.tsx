import type { MatchDetailData } from "@/lib/types";
import { MatchDetailsTabs } from "./match-details-tabs";

export function SubscribeExpandedView({ detail }: { detail: MatchDetailData }) {
  return <MatchDetailsTabs key={detail.id} detail={detail} />;
}
