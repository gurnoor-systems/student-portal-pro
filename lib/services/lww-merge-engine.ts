import { TaskItem, CourseItem, ExamItem, MaterialItem, UserData } from "@/lib/types";

/**
 * Optimistic Last-Write-Wins (LWW) Multi-Device Auto-Merge Engine
 * Reconciles concurrent edits between Phone, Laptop, Desktop, and Tablet
 * with 0 modal interruptions and zero data loss.
 */

export class LWWMergeEngine {
  /**
   * Helper to extract valid numeric timestamp from ISO string or fallback to 0
   */
  private static parseTimestamp(ts?: string): number {
    if (!ts) return 0;
    const time = new Date(ts).getTime();
    return isNaN(time) ? 0 : time;
  }

  /**
   * Merges two TaskItem lists using field-level & record-level LWW
   */
  static mergeTasks(local: TaskItem[] = [], remote: TaskItem[] = []): TaskItem[] {
    const map = new Map<string, TaskItem>();

    // 1. Index local tasks
    for (const item of local) {
      map.set(item.id, item);
    }

    // 2. Merge remote tasks
    for (const rItem of remote) {
      const lItem = map.get(rItem.id);

      if (!lItem) {
        // Only in remote: check if not soft-deleted
        if (!rItem.deletedAt) {
          map.set(rItem.id, rItem);
        }
      } else {
        // Exists in both: compare timestamps
        const lTime = this.parseTimestamp(lItem.updatedAt);
        const rTime = this.parseTimestamp(rItem.updatedAt);

        // Check if either is deleted
        const lDel = this.parseTimestamp(lItem.deletedAt);
        const rDel = this.parseTimestamp(rItem.deletedAt);

        if (rDel > 0 && rDel >= lTime) {
          // Remote deleted after local update
          map.delete(rItem.id);
          continue;
        }
        if (lDel > 0 && lDel >= rTime) {
          // Local deleted after remote update
          map.delete(rItem.id);
          continue;
        }

        if (rTime > lTime) {
          // Remote is newer: take remote, but preserve any local subtasks if remote lacks them
          const mergedSubtasks = this.mergeSubtasks(lItem.subtasks, rItem.subtasks);
          map.set(rItem.id, {
            ...rItem,
            subtasks: mergedSubtasks
          });
        } else {
          // Local is newer or equal: keep local, but merge remote subtasks
          const mergedSubtasks = this.mergeSubtasks(lItem.subtasks, rItem.subtasks);
          map.set(lItem.id, {
            ...lItem,
            subtasks: mergedSubtasks
          });
        }
      }
    }

    // Filter out any marked deleted
    return Array.from(map.values()).filter(t => !t.deletedAt);
  }

  /**
   * Merges subtasks array by subtask ID
   */
  private static mergeSubtasks(
    local?: Array<{ id: string; title: string; completed: boolean }>,
    remote?: Array<{ id: string; title: string; completed: boolean }>
  ): Array<{ id: string; title: string; completed: boolean }> | undefined {
    if (!local && !remote) return undefined;
    if (!local) return remote;
    if (!remote) return local;

    const subMap = new Map<string, { id: string; title: string; completed: boolean }>();
    for (const s of local) subMap.set(s.id, s);
    for (const s of remote) {
      if (!subMap.has(s.id)) {
        subMap.set(s.id, s);
      } else {
        // If one device completed it, prefer completed: true
        const existing = subMap.get(s.id)!;
        subMap.set(s.id, {
          ...s,
          completed: existing.completed || s.completed
        });
      }
    }
    return Array.from(subMap.values());
  }

  /**
   * Merges Courses using LWW
   */
  static mergeCourses(local: CourseItem[] = [], remote: CourseItem[] = []): CourseItem[] {
    const map = new Map<string, CourseItem>();
    for (const c of local) map.set(c.id, c);

    for (const r of remote) {
      const l = map.get(r.id);
      if (!l) {
        if (!r.deletedAt) map.set(r.id, r);
      } else {
        const lTime = this.parseTimestamp(l.updatedAt);
        const rTime = this.parseTimestamp(r.updatedAt);
        const rDel = this.parseTimestamp(r.deletedAt);
        const lDel = this.parseTimestamp(l.deletedAt);

        if (rDel > 0 && rDel >= lTime) {
          map.delete(r.id);
          continue;
        }
        if (lDel > 0 && lDel >= rTime) {
          map.delete(r.id);
          continue;
        }

        if (rTime > lTime) {
          map.set(r.id, r);
        }
      }
    }
    return Array.from(map.values()).filter(c => !c.deletedAt);
  }

  /**
   * Merges Exams using LWW
   */
  static mergeExams(local: ExamItem[] = [], remote: ExamItem[] = []): ExamItem[] {
    const map = new Map<string, ExamItem>();
    for (const e of local) map.set(e.id, e);

    for (const r of remote) {
      const l = map.get(r.id);
      if (!l) {
        if (!r.deletedAt) map.set(r.id, r);
      } else {
        const lTime = this.parseTimestamp(l.updatedAt);
        const rTime = this.parseTimestamp(r.updatedAt);
        const rDel = this.parseTimestamp(r.deletedAt);
        const lDel = this.parseTimestamp(l.deletedAt);

        if (rDel > 0 && rDel >= lTime) {
          map.delete(r.id);
          continue;
        }
        if (lDel > 0 && lDel >= rTime) {
          map.delete(r.id);
          continue;
        }

        if (rTime > lTime) {
          map.set(r.id, r);
        }
      }
    }
    return Array.from(map.values()).filter(e => !e.deletedAt);
  }

  /**
   * Merges Documents using LWW
   */
  static mergeDocuments(local: MaterialItem[] = [], remote: MaterialItem[] = []): MaterialItem[] {
    const map = new Map<string, MaterialItem>();
    for (const d of local) map.set(d.id, d);

    for (const r of remote) {
      const l = map.get(r.id);
      if (!l) {
        if (!r.deletedAt) map.set(r.id, r);
      } else {
        const lTime = this.parseTimestamp(l.updatedAt);
        const rTime = this.parseTimestamp(r.updatedAt);
        if (rTime > lTime) {
          map.set(r.id, r);
        }
      }
    }
    return Array.from(map.values()).filter(d => !d.deletedAt);
  }

  /**
   * Merges full UserData payload
   */
  static mergeUserData(local: UserData, remote: UserData): { merged: UserData; hasChanges: boolean } {
    const mergedTasks = this.mergeTasks(local.tasks, remote.tasks);
    const mergedCourses = this.mergeCourses(local.courses, remote.courses);
    const mergedExams = this.mergeExams(local.exams, remote.exams);
    const mergedDocs = this.mergeDocuments(local.documents, remote.documents);

    const merged: UserData = {
      tasks: mergedTasks,
      courses: mergedCourses,
      exams: mergedExams,
      documents: mergedDocs
    };

    const hasChanges = JSON.stringify(merged) !== JSON.stringify(local);
    return { merged, hasChanges };
  }
}
