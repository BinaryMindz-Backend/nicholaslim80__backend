const pdfmake = require('pdfmake');
import type { TDocumentDefinitions } from 'pdfmake/interfaces';
import path from 'path';

export class ReceiptPdfService {
    async generate(order: any): Promise<Buffer> {
        const fonts = {
            Roboto: {
                normal: path.join(
                    process.cwd(),
                    'src/assets/fonts/Roboto-Regular.ttf',
                ),
                bold: path.join(
                    process.cwd(),
                    'src/assets/fonts/Roboto-Bold.ttf',
                ),
                italics: path.join(
                    process.cwd(),
                    'src/assets/fonts/Roboto-Italic.ttf',
                ),
                bolditalics: path.join(
                    process.cwd(),
                    'src/assets/fonts/Roboto-BoldItalic.ttf',
                ),
            },
        };

        pdfmake.addFonts(fonts);

        const pickup = order.orderStops.find(
            (s) => s.type === 'PICKUP',
        );

        const drops = order.orderStops.filter(
            (s) => s.type === 'DROP',
        );

        const rider =
            order.assign_rider?.registrations?.[0];

        const docDefinition: TDocumentDefinitions = {
            pageMargins: [40, 40, 40, 40],

            content: [
                {
                    text: 'ZIPBEE DELIVERY',
                    style: 'header',
                },

                {
                    text: 'DELIVERY RECEIPT',
                    alignment: 'center',
                    margin: [0, 0, 0, 20],
                },

                {
                    columns: [
                        [
                            {
                                text: `Receipt No: RCP-${order.id}`,
                            },
                            {
                                text: `Order ID: #${order.id}`,
                            },
                        ],
                        [
                            {
                                text: `Date: ${new Date(
                                    order.created_at,
                                ).toLocaleString()}`,
                                alignment: 'right',
                            },
                            {
                                text: `Status: ${order.order_status}`,
                                alignment: 'right',
                            },
                        ],
                    ],
                },

                {
                    text: 'CUSTOMER',
                    style: 'section',
                },

                {
                    table: {
                        widths: ['30%', '*'],
                        body: [
                            ['Name', order.user.username],
                            ['Phone', order.user.phone],
                        ],
                    },
                },

                {
                    text: 'RIDER',
                    style: 'section',
                },

                {
                    table: {
                        widths: ['30%', '*'],
                        body: [
                            ['Name', rider?.raider_name || '-'],
                            ['Phone', rider?.contact_number || '-'],
                        ],
                    },
                },

                {
                    text: 'ORDER DETAILS',
                    style: 'section',
                },

                {
                    table: {
                        widths: ['40%', '*'],
                        body: [
                            ['Delivery Type', order.delivery_type.name],
                            ['Route Type', order.route_type],
                            ['Payment Method', order.pay_type],
                        ],
                    },
                },

                {
                    text: 'PICKUP LOCATION',
                    style: 'section',
                },

                {
                    text: pickup?.address || '-',
                },

                {
                    text: 'DELIVERY LOCATIONS',
                    style: 'section',
                },

                ...drops.flatMap((drop, index) => [
                    {
                        table: {
                            widths: ['35%', '*'],
                            body: [
                                [
                                    'Recipient',
                                    drop.destination.contact_name,
                                ],
                                [
                                    'Address',
                                    drop.address,
                                ],
                                [
                                    'Distance',
                                    `${drop.calculated_distance} km`,
                                ],
                                [
                                    'Amount',
                                    `$${drop.calculated_price}`,
                                ],
                            ],
                        },
                        margin: [0, 5, 0, 10],
                    },
                ]),

                {
                    text: 'PAYMENT SUMMARY',
                    style: 'section',
                },

                {
                    table: {
                        widths: ['*', 120],
                        body: [
                            [
                                'Total Distance',
                                `${order.pricingSummary.totalDistance} km`,
                            ],
                            [
                                'Total Duration',
                                `${order.pricingSummary.totalTimeMin} min`,
                            ],
                            [
                                'Subtotal',
                                `$${order.total_cost}`,
                            ],
                            [
                                'Discount',
                                `$${order.discountAmount}`,
                            ],
                            [
                                'Priority Fee',
                                `$${order.priority_fee}`,
                            ],
                            [
                                {
                                    text: 'TOTAL',
                                    bold: true,
                                },
                                {
                                    text: `$${order.total_cost}`,
                                    bold: true,
                                },
                            ],
                        ],
                    },
                },

                {
                    margin: [0, 20, 0, 0],
                    text:
                        'Thank you for choosing ZB Delivery.',
                    alignment: 'center',
                },
            ],

            styles: {
                header: {
                    fontSize: 22,
                    bold: true,
                    alignment: 'center',
                    margin: [0, 0, 0, 5],
                },

                section: {
                    fontSize: 14,
                    bold: true,
                    margin: [0, 15, 0, 8],
                },
            },
        };

        const pdf = pdfmake.createPdf(docDefinition);

        return pdf.getBuffer();
    }
}