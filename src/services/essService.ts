/**
 * Employee Self-Service (ESS) Service (essService.ts)
 * Manages Leave, Permission, and Financial Advance Loan requests with approval workflow.
 */

import { ESSRequest, ESSRequestStatus, ESSRequestType } from '../types';
import { sqliteAdapter } from '../db/sqliteAdapter';
import { loggerService } from './loggerService';
import { moduleBridgeService } from './moduleBridgeService';

class ESSService {
  public getRequests(filters?: {
    employeeId?: string;
    status?: ESSRequestStatus;
    type?: ESSRequestType;
    branchId?: string;
  }): ESSRequest[] {
    const requests = sqliteAdapter.getTable('essRequests') || [];

    return requests.filter((r) => {
      if (filters?.employeeId && r.employeeId !== filters.employeeId) return false;
      if (filters?.status && filters.status !== ('ALL' as any) && r.status !== filters.status) return false;
      if (filters?.type && filters.type !== ('ALL' as any) && r.type !== filters.type) return false;
      if (filters?.branchId && filters.branchId !== 'ALL' && r.branchId && r.branchId !== filters.branchId) {
        return false;
      }
      return true;
    });
  }

  public submitRequest(
    data: Omit<ESSRequest, 'id' | 'createdAt' | 'status'>
  ): ESSRequest {
    const requests = sqliteAdapter.getTable('essRequests') || [];
    const employees = sqliteAdapter.getTable('employees') || [];
    const emp = employees.find((e) => e.id === data.employeeId);

    const newReq: ESSRequest = {
      ...data,
      id: `ess-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      branchId: data.branchId || emp?.branchId,
      employeeName: data.employeeName || emp?.name || 'موظف غير محدد',
      employeeCode: data.employeeCode || emp?.code,
    };

    sqliteAdapter.updateTable('essRequests', [newReq, ...requests]);
    loggerService.logInfo('ESS', `تم تقديم طلب ${data.type} للموظف ${newReq.employeeName}`);

    moduleBridgeService.publish('ESS_REQUEST_CREATED', { request: newReq });
    return newReq;
  }

  public updateRequestStatus(
    requestId: string,
    status: ESSRequestStatus,
    approvedBy: string,
    notes?: string
  ): ESSRequest {
    const requests = sqliteAdapter.getTable('essRequests') || [];
    const idx = requests.findIndex((r) => r.id === requestId);

    if (idx === -1) {
      throw new Error('الطلب غير موجود في قاعدة البيانات');
    }

    requests[idx].status = status;
    requests[idx].approvedBy = approvedBy;
    if (notes) requests[idx].notes = notes;

    sqliteAdapter.updateTable('essRequests', requests);
    loggerService.logInfo('ESS', `تم تحديث حالة طلب ESS رقم (${requestId}) إلى (${status}) بواسطة ${approvedBy}`);

    moduleBridgeService.publish('ESS_REQUEST_UPDATED', { request: requests[idx] });
    return requests[idx];
  }
}

export const essService = new ESSService();
