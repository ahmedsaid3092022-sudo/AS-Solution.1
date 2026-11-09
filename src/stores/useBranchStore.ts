import { useSyncExternalStore, useCallback } from 'react';
import { Branch } from '../types';
import { sqliteAdapter } from '../db/sqliteAdapter';
import { loggerService } from '../services/loggerService';
import { moduleBridgeService } from '../services/moduleBridgeService';

interface BranchStoreState {
  branches: Branch[];
  activeBranchId: string; // 'ALL' or specific branchId
}

const initialActiveBranch = (typeof window !== 'undefined' && localStorage.getItem('as_active_branch_id')) || 'ALL';

let branchState: BranchStoreState = {
  branches: sqliteAdapter.getTable('branches') || [],
  activeBranchId: initialActiveBranch,
};

const listeners = new Set<() => void>();

function notifyBranch() {
  listeners.forEach((listener) => listener());
}

function subscribeBranch(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getBranchSnapshot() {
  return branchState;
}

export function refreshBranchStore() {
  branchState = {
    ...branchState,
    branches: sqliteAdapter.getTable('branches') || [],
  };
  notifyBranch();
}

export function useBranchStore() {
  const state = useSyncExternalStore(subscribeBranch, getBranchSnapshot, getBranchSnapshot);

  const setActiveBranchId = useCallback((id: string) => {
    branchState = { ...branchState, activeBranchId: id };
    if (typeof window !== 'undefined') {
      localStorage.setItem('as_active_branch_id', id);
    }
    notifyBranch();
    moduleBridgeService.publish('BRANCH_CHANGED', { branchId: id });
  }, []);

  const addBranch = useCallback((data: Omit<Branch, 'id'>) => {
    const branches = sqliteAdapter.getTable('branches') || [];
    const newBranch: Branch = {
      ...data,
      id: `branch-${Date.now()}`,
    };
    sqliteAdapter.updateTable('branches', [...branches, newBranch]);
    loggerService.logInfo('BRANCHES', `تم إضافة فرع جديد: ${newBranch.nameAr}`);
    refreshBranchStore();
    return newBranch;
  }, []);

  const updateBranch = useCallback((branch: Branch) => {
    const branches = sqliteAdapter.getTable('branches') || [];
    const idx = branches.findIndex((b) => b.id === branch.id);
    if (idx !== -1) {
      branches[idx] = branch;
      sqliteAdapter.updateTable('branches', branches);
      loggerService.logInfo('BRANCHES', `تم تحديث بيانات الفرع: ${branch.nameAr}`);
      refreshBranchStore();
    }
  }, []);

  const deleteBranch = useCallback((branchId: string) => {
    const branches = sqliteAdapter.getTable('branches') || [];
    const target = branches.find((b) => b.id === branchId);
    if (target?.isMain) {
      throw new Error('لا يمكن حذف الفرع الرئيسي للمؤسسة');
    }
    const filtered = branches.filter((b) => b.id !== branchId);
    sqliteAdapter.updateTable('branches', filtered);
    loggerService.logInfo('BRANCHES', `تم حذف الفرع رقم (${branchId})`);
    if (branchState.activeBranchId === branchId) {
      branchState.activeBranchId = 'ALL';
      localStorage.setItem('as_active_branch_id', 'ALL');
    }
    refreshBranchStore();
  }, []);

  const activeBranch = state.branches.find((b) => b.id === state.activeBranchId);

  return {
    branches: state.branches,
    activeBranchId: state.activeBranchId,
    activeBranch,
    setActiveBranchId,
    addBranch,
    updateBranch,
    deleteBranch,
    refreshBranches: refreshBranchStore,
  };
}
