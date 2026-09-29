import { useQuery } from "@tanstack/react-query";
import { octokit } from "../api/githubClient";
import { FilterType, PullRequest } from "../types";
import { getPullRequestFilterQuery } from "../utils/getPullRequestFilterQuery";
import { octokitPaginate } from "../api/octokitPaginate";

export const useGetPullRequests = (filter: FilterType, query = "") => {
  const q = getPullRequestFilterQuery(filter, query);
  return useQuery<PullRequest[]>({
    queryKey: ["githubPrs", q, filter],
    queryFn: async () => {
      if (filter === "inbox") {
        const queries = [
          q,
          getPullRequestFilterQuery("assigned", query),
          getPullRequestFilterQuery("incoming", query),
        ];
        const results = await Promise.all(
          queries.map((q) =>
            octokitPaginate(octokit.search.issuesAndPullRequests, {
              q,
              sort: "updated",
              order: "desc",
              per_page: 100,
            }),
          ),
        );
        return [
          ...new Map(results.flat().map((pr) => [pr.id, pr])).values(),
        ].sort((a, b) => b.updated_at.localeCompare(a.updated_at));
      }
      return octokitPaginate(octokit.search.issuesAndPullRequests, {
        q,
        sort: "updated",
        order: "desc",
        per_page: 100,
      });
    },
  });
};
