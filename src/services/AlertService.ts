import { Mail, Clock, AlertCircle, CheckCircle, XCircle, LucideIcon } from 'lucide-react';

export type AlertType = 'error' | 'warning' | 'info' | 'success';

export interface Alert {
  id: string;
  type: AlertType;
  message: string;
  timestamp: Date;
  category: 'gib' | 'finance' | 'system' | 'order';
}

export const getAlertIcon = (type: AlertType): LucideIcon => {
  switch (type) {
    case 'error': return XCircle;
    case 'warning': return AlertCircle;
    case 'info': return Mail;
    case 'success': return CheckCircle;
    default: return Clock;
  }
};
export const checkFinancialAlerts = (companies: any[]): Alert[] => {
  const alerts: Alert[] = [];
  const now = new Date();
  
  companies.forEach(company => {
    // Check if company has overdue debts based on due date
    if (company.balance > 0 && company.due_date && new Date(company.due_date) < now) {
      alerts.push({
        id: `overdue-${company.id}`,
        type: 'error',
        message: `${company.name} için ödeme vadesi geçmiş!`,
        timestamp: new Date(),
        category: 'finance'
      });
    }
  });
  return alerts;
};

export const checkGibAlerts = (invoices: any[]): Alert[] => {
  const alerts: Alert[] = [];
  invoices.forEach(invoice => {
    if (invoice.integration_status === 'REJECTED' || invoice.integration_status === 'FAILED') {
      alerts.push({
        id: `gib-error-${invoice.id}`,
        type: 'error',
        message: `Fatura Teslimi Başarısız: ${invoice.document_number || invoice.id}`,
        timestamp: new Date(),
        category: 'gib'
      });
    }
  });
  return alerts;
};

export const checkInventoryAlerts = (products: any[]): Alert[] => {
  const alerts: Alert[] = [];
  products.forEach(product => {
    if (!product.brand || !product.barcode || !product.category || !product.sale_price) {
      alerts.push({
        id: `inventory-config-${product.id}`,
        type: 'warning',
        message: `Ürün Yapılandırması Eksik: ${product.name}`,
        timestamp: new Date(),
        category: 'system'
      });
    }
  });
  return alerts;
};


export const checkReconciliationAlerts = (reconciliations: any[]): Alert[] => {
  const alerts: Alert[] = [];
  reconciliations.forEach(recon => {
    if (recon.status === 'pending') {
      alerts.push({
        id: `recon-pending-${recon.id}`,
        type: 'info',
        message: `Yeni Mutabakat Talebi: ${recon.companyTitle} - ${recon.periodMonthName}`,
        timestamp: new Date(),
        category: 'finance'
      });
    }
  });
  return alerts;
};

export const checkSystemAlerts = (auditLogs: any[]): Alert[] => {
  const alerts: Alert[] = [];
  auditLogs.forEach(log => {
    if (log.action && log.action.includes('ERROR')) {
      alerts.push({
        id: `system-error-${log.id}`,
        type: 'error',
        message: `Sistem Hatası: ${log.details || log.action}`,
        timestamp: new Date(log.created_at),
        category: 'system'
      });
    }
  });
  return alerts;
};
