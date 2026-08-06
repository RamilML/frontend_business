import { Act } from '../types/act';
import { Shipment } from '../types/shipment';

export class ExportUtils {
  /**
   * Экспорт Акта выполненных работ в формат Excel (.csv / .xlsx)
   */
  public static exportActToExcel(act: Act): void {
    const rows: string[][] = [
      ['АКТ ВЫПОЛНЕННЫХ РАБОТ №', act.actNumber],
      ['Дата:', act.date],
      ['Контрагент (Заказчик):', act.clientName],
      ['Оператор (Сдал):', act.operatorName],
      [''],
      ['ИСПОЛНИТЕЛЬ:', act.executorRequisites.companyName],
      ['ИНН/КПП:', act.executorRequisites.innKpp],
      ['Банк:', act.executorRequisites.bankName],
      ['р/с:', act.executorRequisites.checkingAccount],
      [''],
      ['ЗАКАЗЧИК:', act.clientRequisitesText],
      [''],
      ['№', 'Выполненная услуга', 'Цена (сом/руб)', 'Количество', 'Сумма']
    ];

    let lineNo = 1;
    act.items
      .filter((item) => item.enabled)
      .forEach((item) => {
        rows.push([
          String(lineNo++),
          `"${item.name.replace(/"/g, '""')}"`,
          String(item.price),
          String(item.quantity),
          String(item.amount)
        ]);
      });

    rows.push(['', '', '', 'ИТОГО К ОПЛАТЕ:', String(act.totalSum)]);

    const csvContent = '\uFEFF' + rows.map((r) => r.join(';')).join('\n');
    this.downloadBlob(csvContent, `${act.actNumber}.csv`, 'text/csv;charset=utf-8;');
  }

  /**
   * Экспорт состава коробок поставки в Excel (.csv)
   */
  public static exportPackingToExcel(shipment: Shipment): void {
    const rows: string[][] = [
      ['УПАКОЧНЫЙ ЛИСТ ПОСТАВКИ №', shipment.shipmentNumber],
      ['Контрагент:', shipment.clientName],
      ['Дата:', new Date().toLocaleDateString('ru-RU')],
      ['Склады WB:', shipment.targetWarehouses.join(', ')],
      [''],
      ['Склад WB', 'Коробка №', 'Штрихкод', 'Наименование товара', 'Количество']
    ];

    shipment.boxes.forEach((box) => {
      box.items.forEach((item) => {
        rows.push([
          `"${box.targetWarehouse}"`,
          String(box.boxNumber),
          `"${item.barcode}"`,
          `"${item.title.replace(/"/g, '""')}"`,
          String(item.quantity)
        ]);
      });
    });

    const csvContent = '\uFEFF' + rows.map((r) => r.join(';')).join('\n');
    this.downloadBlob(csvContent, `Packing_${shipment.shipmentNumber}.csv`, 'text/csv;charset=utf-8;');
  }

  /**
   * Экспорт Акта в формате Word (.doc / HTML-compatible Word XML)
   */
  public static exportActToWord(act: Act): void {
    const itemsHtml = act.items
      .filter((i) => i.enabled)
      .map(
        (i, idx) => `
        <tr>
          <td style="border:1px solid #000; padding:5px;">${idx + 1}</td>
          <td style="border:1px solid #000; padding:5px;">${i.name}</td>
          <td style="border:1px solid #000; padding:5px; text-align:right;">${i.price}</td>
          <td style="border:1px solid #000; padding:5px; text-align:right;">${i.quantity}</td>
          <td style="border:1px solid #000; padding:5px; text-align:right;"><b>${i.amount}</b></td>
        </tr>
      `
      )
      .join('');

    const wordHtml = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>${act.actNumber}</title></head>
      <body style="font-family: Arial, sans-serif;">
        <h2 style="text-align:center;">АКТ ВЫПОЛНЕННЫХ РАБОТ № ${act.actNumber}</h2>
        <p><b>Дата:</b> ${act.date}</p>
        <p><b>Исполнитель:</b> ${act.executorRequisites.companyName} (ИНН: ${act.executorRequisites.innKpp})</p>
        <p><b>Заказчик:</b> ${act.clientName}</p>
        <hr/>
        <h3>Перечень выполненных услуг:</h3>
        <table style="width:100%; border-collapse:collapse; border:1px solid #000;">
          <thead>
            <tr style="background:#f1f5f9;">
              <th style="border:1px solid #000; padding:5px;">№</th>
              <th style="border:1px solid #000; padding:5px;">Наименование услуги</th>
              <th style="border:1px solid #000; padding:5px;">Цена</th>
              <th style="border:1px solid #000; padding:5px;">Кол-во</th>
              <th style="border:1px solid #000; padding:5px;">Сумма</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
            <tr>
              <td colspan="4" style="border:1px solid #000; padding:8px; text-align:right;"><b>ИТОГО К ОПЛАТЕ:</b></td>
              <td style="border:1px solid #000; padding:8px; text-align:right;"><b>${act.totalSum.toLocaleString()} сом/руб.</b></td>
            </tr>
          </tbody>
        </table>
        <br/><br/>
        <table style="width:100%;">
          <tr>
            <td><b>Сдал (Исполнитель):</b> _______________ / ${act.operatorName}</td>
            <td><b>Принял (Заказчик):</b> _______________ / ${act.clientName}</td>
          </tr>
        </table>
      </body>
      </html>
    `;

    this.downloadBlob(wordHtml, `${act.actNumber}.doc`, 'application/msword;charset=utf-8;');
  }

  /**
   * Выгрузка Blob в браузер для скачивания
   */
  private static downloadBlob(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
