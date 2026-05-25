import { RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { getApiErrorMessage } from '@/api/client';
import {
  getUserRecipeReport,
  getUserRecipeReports,
  updateUserRecipeReport,
  UserRecipeReport,
  UserRecipeReportFilters,
  UserRecipeReportReason,
  UserRecipeReportStatus,
} from '@/api/userRecipeReports';

const STATUS_OPTIONS: Array<{
  label: string;
  value: UserRecipeReportStatus | '';
}> = [
  { label: '전체', value: '' },
  { label: '대기', value: 'PENDING' },
  { label: '검토 중', value: 'REVIEWING' },
  { label: '해결', value: 'RESOLVED' },
  { label: '반려', value: 'REJECTED' },
];

const STATUS_LABEL: Record<UserRecipeReportStatus, string> = {
  PENDING: '대기',
  REVIEWING: '검토 중',
  RESOLVED: '해결',
  REJECTED: '반려',
};

const STATUS_BADGE_CLASS: Record<UserRecipeReportStatus, string> = {
  PENDING: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  REVIEWING: 'bg-sky-50 text-sky-700 ring-1 ring-sky-200',
  RESOLVED: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  REJECTED: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
};

const REASON_LABEL: Record<UserRecipeReportReason, string> = {
  INAPPROPRIATE: '부적절한 내용',
  COPYRIGHT: '저작권',
  SPAM: '스팸',
  DANGEROUS: '위험 정보',
  FALSE_INFO: '허위 정보',
  OTHER: '기타',
};

function formatDate(value?: string | null) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function NumberFilter({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | '';
  onChange: (value: number | '') => void;
}) {
  return (
    <label className="flex min-w-40 flex-col gap-1 text-xs font-semibold text-slate-500">
      {label}
      <input
        value={value}
        inputMode="numeric"
        onChange={event => {
          const next = event.target.value.trim();
          if (!next) {
            onChange('');
            return;
          }
          const parsed = Number(next);
          if (Number.isInteger(parsed) && parsed > 0) {
            onChange(parsed);
          }
        }}
        className="h-9 rounded border border-slate-200 bg-white px-3 text-sm font-medium text-slate-900 outline-none focus:border-(--color-main-ui)"
      />
    </label>
  );
}

function ReportRow({
  report,
  selected,
  onClick,
}: {
  report: UserRecipeReport;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`grid w-full min-w-4xl grid-cols-[5rem_7rem_8rem_8rem_1fr_7rem] items-center gap-3 border-b border-slate-100 px-4 py-3 text-left text-sm transition-colors hover:bg-slate-50 ${
        selected
          ? 'border-l-2 border-l-(--color-main) bg-(--color-lighter)'
          : 'bg-white'
      }`}
    >
      <span className="font-mono text-xs text-slate-500">
        #{report.report_id}
      </span>
      <span className="font-mono text-xs text-slate-600">
        recipe #{report.user_recipe_id}
      </span>
      <span className="text-xs text-slate-600">
        신고자 #{report.reporter_user_id}
      </span>
      <span className="text-xs text-slate-600">
        작성자 #{report.recipe_owner_user_id}
      </span>
      <span className="min-w-0">
        <span className="block truncate font-semibold text-slate-950">
          {REASON_LABEL[report.reason]}
        </span>
        <span className="mt-0.5 block truncate text-xs text-slate-500">
          {report.description || '설명 없음'}
        </span>
      </span>
      <span
        className={`justify-self-start rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_BADGE_CLASS[report.status]}`}
      >
        {STATUS_LABEL[report.status]}
      </span>
    </button>
  );
}

function ReportReviewForm({
  detail,
  busy,
  onUpdate,
}: {
  detail: UserRecipeReport;
  busy: boolean;
  onUpdate: (
    reportId: number,
    status: UserRecipeReportStatus,
    reviewNote?: string,
  ) => void;
}) {
  const [nextStatus, setNextStatus] = useState<UserRecipeReportStatus>(
    detail.status,
  );
  const [reviewNote, setReviewNote] = useState(detail.review_note ?? '');

  return (
    <section className="space-y-2 border-t border-slate-100 pt-4">
      <label className="flex flex-col gap-1 text-xs font-semibold text-slate-500">
        처리 상태
        <select
          value={nextStatus}
          onChange={event =>
            setNextStatus(event.target.value as UserRecipeReportStatus)
          }
          disabled={busy}
          className="h-9 rounded border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none focus:border-(--color-main-ui)"
        >
          {STATUS_OPTIONS.filter(option => option.value).map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-xs font-semibold text-slate-500">
        검토 메모
        <textarea
          value={reviewNote}
          onChange={event => setReviewNote(event.target.value)}
          disabled={busy}
          rows={5}
          className="resize-none rounded border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-(--color-main-ui)"
        />
      </label>
      <button
        type="button"
        onClick={() =>
          onUpdate(detail.report_id, nextStatus, reviewNote || undefined)
        }
        disabled={
          busy ||
          (nextStatus === detail.status &&
            reviewNote === (detail.review_note ?? ''))
        }
        className="h-9 w-full rounded-lg bg-(--color-main-ui) px-4 text-sm font-bold text-white transition-colors hover:bg-(--color-main) disabled:bg-slate-200 disabled:text-slate-400"
      >
        {busy ? '처리 중' : '저장'}
      </button>
    </section>
  );
}

function DetailPanel({
  detail,
  busy,
  onUpdate,
}: {
  detail: UserRecipeReport | null;
  busy: boolean;
  onUpdate: (
    reportId: number,
    status: UserRecipeReportStatus,
    reviewNote?: string,
  ) => void;
}) {
  if (!detail) {
    return (
      <aside className="flex h-full items-center justify-center border-l border-slate-200 bg-white text-sm text-slate-500">
        왼쪽 목록에서 신고를 선택하세요.
      </aside>
    );
  }

  return (
    <aside className="flex h-full min-h-0 min-w-0 flex-col border-l border-slate-200 bg-white">
      <header className="border-b border-slate-200 px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-500">
              신고 #{detail.report_id} · 레시피 #{detail.user_recipe_id}
            </p>
            <h2 className="mt-1 text-lg font-bold text-slate-950">
              {REASON_LABEL[detail.reason]}
            </h2>
          </div>
          <span
            className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_BADGE_CLASS[detail.status]}`}
          >
            {STATUS_LABEL[detail.status]}
          </span>
        </div>
      </header>

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-4">
        <section className="grid grid-cols-2 gap-2">
          <div className="rounded border border-slate-200 bg-slate-50 px-3 py-2">
            <p className="text-xs font-semibold text-slate-500">신고자</p>
            <p className="mt-1 font-mono text-sm font-semibold text-slate-950">
              #{detail.reporter_user_id}
            </p>
          </div>
          <div className="rounded border border-slate-200 bg-slate-50 px-3 py-2">
            <p className="text-xs font-semibold text-slate-500">작성자</p>
            <p className="mt-1 font-mono text-sm font-semibold text-slate-950">
              #{detail.recipe_owner_user_id}
            </p>
          </div>
          <div className="rounded border border-slate-200 bg-slate-50 px-3 py-2">
            <p className="text-xs font-semibold text-slate-500">접수</p>
            <p className="mt-1 text-sm font-semibold text-slate-950">
              {formatDate(detail.created_at)}
            </p>
          </div>
          <div className="rounded border border-slate-200 bg-slate-50 px-3 py-2">
            <p className="text-xs font-semibold text-slate-500">검토</p>
            <p className="mt-1 text-sm font-semibold text-slate-950">
              {detail.reviewed_by
                ? `#${detail.reviewed_by} · ${formatDate(detail.reviewed_at)}`
                : '-'}
            </p>
          </div>
        </section>

        <section>
          <h3 className="mb-2 text-sm font-bold text-slate-950">신고 내용</h3>
          <p className="rounded border border-slate-200 bg-white px-3 py-2 text-sm leading-6 whitespace-pre-wrap text-slate-700">
            {detail.description || '설명이 없습니다.'}
          </p>
        </section>

        <ReportReviewForm
          key={detail.report_id}
          detail={detail}
          busy={busy}
          onUpdate={onUpdate}
        />
      </div>
    </aside>
  );
}

export default function ReportsPage() {
  const [filters, setFilters] = useState<UserRecipeReportFilters>({
    status: 'PENDING',
    user_recipe_id: '',
    reporter_user_id: '',
    recipe_owner_user_id: '',
  });
  const [reports, setReports] = useState<UserRecipeReport[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<UserRecipeReport | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const listRequestIdRef = useRef(0);
  const detailRequestIdRef = useRef(0);

  const selectedReport = useMemo(
    () => reports.find(report => report.report_id === selectedId) ?? null,
    [reports, selectedId],
  );

  const loadReports = useCallback(
    async (
      nextFilters = filters,
      options: { append?: boolean; cursor?: string | null } = {},
    ) => {
      const append = options.append === true;
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      const requestId = ++listRequestIdRef.current;
      setErrorMessage(null);
      try {
        const data = await getUserRecipeReports({
          ...nextFilters,
          cursor: options.cursor,
        });
        if (requestId !== listRequestIdRef.current) return;
        setNextCursor(data.next_cursor);
        setHasNext(data.has_next);
        if (append) {
          setReports(currentReports => [...currentReports, ...data.items]);
        } else {
          setReports(data.items);
          if (data.items.length === 0) {
            setSelectedId(null);
            setDetail(null);
          } else {
            setSelectedId(currentId =>
              currentId && data.items.some(item => item.report_id === currentId)
                ? currentId
                : data.items[0].report_id,
            );
          }
        }
      } catch (error) {
        if (requestId !== listRequestIdRef.current) return;
        setErrorMessage(
          getApiErrorMessage(
            error,
            '사용자 레시피 신고 목록을 불러오지 못했습니다.',
          ),
        );
      } finally {
        if (requestId === listRequestIdRef.current) {
          if (append) {
            setLoadingMore(false);
          } else {
            setLoading(false);
          }
        }
      }
    },
    [filters],
  );

  const loadDetail = useCallback(async (reportId: number) => {
    setDetailLoading(true);
    const requestId = ++detailRequestIdRef.current;
    setErrorMessage(null);
    try {
      const nextDetail = await getUserRecipeReport(reportId);
      if (requestId !== detailRequestIdRef.current) return;
      setDetail(nextDetail);
    } catch (error) {
      if (requestId !== detailRequestIdRef.current) return;
      setErrorMessage(
        getApiErrorMessage(
          error,
          '사용자 레시피 신고 상세를 불러오지 못했습니다.',
        ),
      );
    } finally {
      if (requestId === detailRequestIdRef.current) {
        setDetailLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadReports();
  }, [loadReports]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (selectedId) void loadDetail(selectedId);
  }, [loadDetail, selectedId]);

  function updateFilter<K extends keyof UserRecipeReportFilters>(
    key: K,
    value: UserRecipeReportFilters[K],
  ) {
    setFilters(current => ({ ...current, [key]: value }));
  }

  function loadNextPage() {
    if (!nextCursor || loadingMore) return;
    void loadReports(filters, { append: true, cursor: nextCursor });
  }

  async function runUpdate(
    reportId: number,
    status: UserRecipeReportStatus,
    reviewNote?: string,
  ) {
    setBusyId(reportId);
    setErrorMessage(null);
    try {
      const updated = await updateUserRecipeReport(reportId, {
        status,
        review_note: reviewNote ?? null,
      });
      setReports(currentReports =>
        currentReports.flatMap(report => {
          if (report.report_id !== reportId) return [report];
          if (filters.status && updated.status !== filters.status) return [];
          return [updated];
        }),
      );
      if (filters.status && updated.status !== filters.status) {
        setSelectedId(null);
        setDetail(null);
      } else {
        setDetail(updated);
      }
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error, '신고 처리를 저장하지 못했습니다.'),
      );
    } finally {
      setBusyId(null);
    }
  }

  const pendingCount = reports.filter(
    report => report.status === 'PENDING',
  ).length;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-950">
              사용자 레시피 신고
              {pendingCount > 0 && (
                <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-sm font-semibold text-amber-700">
                  {pendingCount}
                </span>
              )}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              접수된 신고를 검토하고 처리 상태와 내부 메모를 남깁니다.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadReports()}
            className="flex h-9 items-center gap-1.5 rounded-lg bg-(--color-main-ui) px-4 text-sm font-bold text-white transition-colors hover:bg-(--color-main)"
          >
            <RefreshCw size={14} />
            새로고침
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-end gap-3">
          <label className="flex min-w-36 flex-col gap-1 text-xs font-semibold text-slate-500">
            처리 상태
            <select
              value={filters.status ?? ''}
              onChange={event =>
                updateFilter(
                  'status',
                  event.target.value as UserRecipeReportStatus | '',
                )
              }
              className="h-9 rounded border border-slate-200 bg-white px-2 text-sm font-medium text-slate-900 outline-none focus:border-(--color-main-ui)"
            >
              {STATUS_OPTIONS.map(option => (
                <option key={option.value || 'all'} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <NumberFilter
            label="레시피 ID"
            value={filters.user_recipe_id ?? ''}
            onChange={value => updateFilter('user_recipe_id', value)}
          />
          <NumberFilter
            label="신고자 ID"
            value={filters.reporter_user_id ?? ''}
            onChange={value => updateFilter('reporter_user_id', value)}
          />
          <NumberFilter
            label="작성자 ID"
            value={filters.recipe_owner_user_id ?? ''}
            onChange={value => updateFilter('recipe_owner_user_id', value)}
          />
        </div>
      </header>

      {errorMessage && (
        <div className="mx-6 mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_minmax(20rem,28rem)] overflow-hidden">
        <section className="min-w-0 overflow-hidden bg-white">
          <div className="h-full overflow-auto pb-20">
            <div className="grid min-w-4xl grid-cols-[5rem_7rem_8rem_8rem_1fr_7rem] gap-3 border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs font-bold tracking-wide text-slate-500">
              <span>번호</span>
              <span>레시피</span>
              <span>신고자</span>
              <span>작성자</span>
              <span>사유</span>
              <span>상태</span>
            </div>
            {loading ? (
              <div className="min-w-4xl">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-[5rem_7rem_8rem_8rem_1fr_7rem] gap-3 border-b border-slate-100 px-4 py-3"
                  >
                    {Array.from({ length: 6 }).map((__, j) => (
                      <div
                        key={j}
                        className="h-4 animate-pulse rounded bg-slate-200"
                      />
                    ))}
                  </div>
                ))}
              </div>
            ) : reports.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-slate-500">
                조건에 맞는 신고가 없습니다.
              </p>
            ) : (
              <>
                {reports.map(report => (
                  <ReportRow
                    key={report.report_id}
                    report={report}
                    selected={report.report_id === selectedId}
                    onClick={() => setSelectedId(report.report_id)}
                  />
                ))}
                {hasNext && (
                  <div className="min-w-4xl border-t border-slate-100 px-4 py-3">
                    <button
                      type="button"
                      onClick={loadNextPage}
                      disabled={loadingMore}
                      className="h-9 w-full rounded-lg border border-slate-200 bg-white text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 disabled:text-slate-400"
                    >
                      {loadingMore ? '불러오는 중...' : '더 보기'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        {detailLoading && selectedReport ? (
          <aside className="flex h-full items-center justify-center border-l border-slate-200 bg-white text-sm text-slate-500">
            상세 정보를 불러오는 중...
          </aside>
        ) : (
          <DetailPanel
            detail={detail}
            busy={busyId === detail?.report_id}
            onUpdate={(reportId, status, reviewNote) =>
              void runUpdate(reportId, status, reviewNote)
            }
          />
        )}
      </div>
    </div>
  );
}
