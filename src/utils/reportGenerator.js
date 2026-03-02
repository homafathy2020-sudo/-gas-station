import { calcNet, totalCash, totalDed, totalRewards } from './helpers';

// ==================== REPORTS ====================
export const generateMonthlyReport = (workers, month, year, monthName) => {
  const C = (v, s, t) => ({ v, s: s ?? 0, t: t ?? (typeof v === 'number' ? 'n' : 's') });
  const E = (s) => C('', s ?? 0);

  const totalSal = workers.reduce((s, w) => s + w.salary, 0);
  const allDed   = workers.reduce((s, w) => s + totalDed(w), 0);
  const allRew   = workers.reduce((s, w) => s + totalRewards(w), 0);
  const totalNet = workers.reduce((s, w) => s + calcNet(w), 0);

  // ── Sheet 1: ملخص الشهر ──
  const summaryRows = [
    { cells: [C(`التقرير الشهري - ${monthName} ${year}`,1),E(1),E(1),E(1),E(1),E(1),E(1),E(1)], ht: 32 },
    { cells: [C('WaqoudPro',15),E(15),E(15),E(15),E(15),E(15),E(15),E(15)], ht: 26 },
    { cells: Array(8).fill(E(0)) },
    { cells: [C('العامل',1),C('مكان العمل',1),C('ايام العمل',1),C('التاخيرات',1),C('الغيابات',1),C('الخصومات',1),C('الحوافز',1),C('السحب النقدي',1),C('صافي المدفوع',1)], ht: 24 },
    ...workers.map((w, i) => {
      const ev = i % 2 === 0;
      const net = calcNet(w);
      return { cells: [
        C(w.name, ev?6:7), C(w.pump, ev?6:7), C(w.workDays, ev?6:7, 'n'),
        C(w.delays.length, ev?6:7, 'n'), C(w.absences.length, ev?6:7, 'n'),
        C(totalDed(w), ev?10:12, 'n'), C(totalRewards(w), ev?11:13, 'n'),
        C(totalCash(w), ev?10:12, 'n'),
        C(net, net >= w.salary*0.9 ? (ev?11:13) : (ev?10:12), 'n'),
      ]};
    }),
    { cells: Array(9).fill(E(0)) },
    { cells: [
      C('الاجمالي',8), E(8),
      C(workers.reduce((s,w)=>s+w.workDays,0),8,'n'),
      C(workers.reduce((s,w)=>s+w.delays.length,0),8,'n'),
      C(workers.reduce((s,w)=>s+w.absences.length,0),8,'n'),
      C(allDed,9,'n'), C(allRew,8,'n'),
      C(workers.reduce((s,w)=>s+totalCash(w),0),9,'n'),
      C(totalNet,8,'n'),
    ], ht: 26 },
  ];
  const summarySheet = {
    name: 'ملخص الشهر',
    colWidths: [22,16,13,13,13,18,16,18,20],
    merges: ['A1:I1','A2:I2'],
    rows: summaryRows,
  };

  // ── Sheets per worker ──
  const workerSheets = workers.map(w => {
    const net = calcNet(w);
    const absNR = w.absences_no_reason || [];
    const disc  = w.discipline || [];
    const delDed  = w.delays.reduce((s,d)=>s+d.deduction,0);
    const absDed  = w.absences.reduce((s,a)=>s+a.deduction,0);
    const absNRDed= absNR.reduce((s,a)=>s+a.deduction,0);
    const rewTotal= disc.reduce((s,d)=>s+d.reward,0);

    const rows = [
      { cells: [C(`تقرير العامل: ${w.name}`,1),E(1),E(1),E(1)], ht: 30 },
      { cells: [C(`${monthName} ${year} - ${w.pump}`,15),E(15),E(15),E(15)], ht: 24 },
      { cells: [E(0),E(0),E(0),E(0)] },
      { cells: [C('البيان',1),C('التفاصيل',1),E(1),E(1)], ht: 22 },
      { cells: [C('ايام العمل',6),C(w.workDays,6,'n'),E(6),E(6)] },
      { cells: [C('الراتب الاساسي',7),C(w.salary,14,'n'),E(7),E(7)] },
      { cells: [C('اجمالي خصم التاخيرات',6),C(delDed,10,'n'),E(6),E(6)] },
      { cells: [C('اجمالي خصم الغيابات',7),C(absDed,10,'n'),E(7),E(7)] },
      { cells: [C('اجمالي خصم العجز',6),C(absNRDed,10,'n'),E(6),E(6)] },
      { cells: [C('اجمالي الحوافز',7),C(rewTotal,11,'n'),E(7),E(7)] },
      { cells: [C('السحب النقدي',6),C(totalCash(w),10,'n'),E(6),E(6)] },
      { cells: [C('صافي المدفوعات',16),C(net,16,'n'),E(16),E(16)], ht: 26 },
      { cells: [E(0),E(0),E(0),E(0)] },
      // delays section
      { cells: [C('--- التاخيرات ---',5),E(5),E(5),E(5)], ht: 22 },
      { cells: [C('#',1),C('التاريخ',1),C('المدة (دقيقة)',1),C('الخصم',1)], ht: 20 },
      ...w.delays.map((d,i) => { const ev=i%2===0; return { cells:[C(i+1,ev?6:7,'n'),C(d.date,ev?6:7),C(d.minutes,ev?6:7,'n'),C(d.deduction,ev?10:12,'n')] }; }),
      { cells: [E(9),E(9),C('الاجمالي',9),C(delDed,9,'n')], ht: 20 },
      { cells: [E(0),E(0),E(0),E(0)] },
      // absences section
      { cells: [C('--- الغيابات ---',2),E(2),E(2),E(2)], ht: 22 },
      { cells: [C('#',1),C('التاريخ',1),C('السبب',1),C('الخصم',1)], ht: 20 },
      ...w.absences.map((a,i) => { const ev=i%2===0; return { cells:[C(i+1,ev?6:7,'n'),C(a.date,ev?6:7),C(a.reason,ev?6:7),C(a.deduction,ev?10:12,'n')] }; }),
      { cells: [E(9),E(9),C('الاجمالي',9),C(absDed,9,'n')], ht: 20 },
      { cells: [E(0),E(0),E(0),E(0)] },
      // absNR section
      { cells: [C('--- العجز ---',4),E(4),E(4),E(4)], ht: 22 },
      { cells: [C('#',1),C('التاريخ',1),C('قيمة العجز',1),E(1)], ht: 20 },
      ...absNR.map((a,i) => { const ev=i%2===0; return { cells:[C(i+1,ev?6:7,'n'),C(a.date,ev?6:7),C(a.deduction,ev?10:12,'n'),E(ev?6:7)] }; }),
      { cells: [E(9),E(9),C(absNRDed,9,'n'),E(9)], ht: 20 },
      { cells: [E(0),E(0),E(0),E(0)] },
      // discipline section
      { cells: [C('--- الانضباط ---',3),E(3),E(3),E(3)], ht: 22 },
      { cells: [C('#',1),C('التاريخ',1),C('النجوم',1),C('الحافز',1)], ht: 20 },
      ...disc.map((d,i) => { const ev=i%2===0; return { cells:[C(i+1,ev?6:7,'n'),C(d.date,ev?6:7),C('★'.repeat(d.stars)+'☆'.repeat(5-d.stars),ev?6:7),C(d.reward,ev?11:13,'n')] }; }),
      { cells: [E(8),E(8),C('اجمالي الحوافز',8),C(rewTotal,8,'n')], ht: 20 },
    ];

    return {
      name: w.name.slice(0,28),
      colWidths: [26,16,18,16],
      merges: ['A1:D1','A2:D2','A11:D11'],
      rows,
    };
  });

  const { runWithJSZip } = buildXlsxBlob([summarySheet, ...workerSheets]);
  loadJSZip(JSZip => runWithJSZip(JSZip, `التقرير-الشهري-${monthName}-${year}.xlsx`));
};


// ==================== MONTH RESET MODAL ====================