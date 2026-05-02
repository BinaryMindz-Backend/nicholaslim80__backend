  // async addDestinationToOrder(
  //   orderId: number,
  //   destinationId: number,
  //   userId: number,
  //   stopType: StopType,
  // ) {
  //   // Verify order ownership
  //   const order = await this.prisma.order.findUnique({
  //     where: { id: orderId },
  //     include: { orderStops: true },
  //   });

  //   if (!order || order.userId !== userId) {
  //     throw new BadRequestException('Order not found or unauthorized');
  //   }

  //   if (order.order_status !== OrderStatus.PROGRESS) {
  //     throw new BadRequestException('Cannot modify placed order');
  //   }

  //   // Get destination
  //   const destination = await this.prisma.destination.findUnique({
  //     where: { id: destinationId },
  //   });

  //   if (!destination || destination.userId !== userId) {
  //     throw new BadRequestException('Destination not found or unauthorized');
  //   }

  //   // Validate destination type
  //   if (stopType === StopType.PICKUP && destination.type === DestinationType.RECEIVER) {
  //     throw new BadRequestException('Cannot use RECEIVER-only destination as pickup');
  //   }
  //   if (stopType === StopType.DROP && destination.type === DestinationType.SENDER) {
  //     throw new BadRequestException('Cannot use SENDER-only destination as drop');
  //   }

  //   // Check if already added
  //   const existing = await this.prisma.orderStop.findFirst({
  //     where: { orderId, destinationId, type: stopType },
  //   });

  //   if (existing) {
  //     throw new BadRequestException('Destination already added to order');
  //   }

  //   // Determine sequence
  //   let sequence: number;

  //   if (stopType === StopType.PICKUP) {
  //     // Pickup is always sequence 1 (index 0)
  //     sequence = 1;

  //     // If pickup already exists, update it instead
  //     const existingPickup = await this.prisma.orderStop.findFirst({
  //       where: { orderId, type: StopType.PICKUP },
  //     });

  //     if (existingPickup) {
  //       // Update existing pickup
  //       return this.prisma.orderStop.update({
  //         where: { id: existingPickup.id },
  //         data: {
  //           destinationId,
  //           address: destination.address!,
  //           latitude: destination.latitude!,
  //           longitude: destination.longitude!,
  //         },
  //       });
  //     }
  //   } else {
  //     // Drops start from sequence 2, 3, 4...
  //     const maxSequence = await this.prisma.orderStop.findFirst({
  //       where: { orderId },
  //       orderBy: { sequence: 'desc' },
  //       select: { sequence: true },
  //     });

  //     sequence = (maxSequence?.sequence || 1) + 1;
  //   }

  //   // Create stop
  //   const orderStop = await this.prisma.orderStop.create({
  //     data: {
  //       orderId,
  //       destinationId,
  //       type: stopType,
  //       sequence,
  //       address: destination.address!,
  //       latitude: destination.latitude!,
  //       longitude: destination.longitude!,
  //       payment: {
  //         create: {
  //           payType: order.pay_type ?? PayType.COD,
  //           amount: 0,
  //           status: PaymentStatus.UNPAID,
  //         },
  //       },
  //     },
  //   });

  //   // Update destination usage stats
  //   await this.prisma.destination.update({
  //     where: { id: destinationId },
  //     data: {
  //       lastUsedAt: new Date(),
  //       useCount: { increment: 1 },
  //     },
  //   });

  //   // Recalculate price with individual pricing
  //   const pricingResult = await this.recalculateOrderPrice(orderId);

  //   return {
  //     orderStop,
  //     pricing: pricingResult,
  //   };
  // }


//    async removeDestinationFromOrder(orderId: number, orderStopId: number, userId: number) {
//       const order = await this.prisma.order.findUnique({
//         where: { id: orderId },
//       });
  
//       if (!order || order.userId !== userId) {
//         throw new BadRequestException('Order not found or unauthorized');
//       }
  
//       if (order.order_status !== OrderStatus.PROGRESS) {
//         throw new BadRequestException('Cannot modify placed order');
//       }
  
//       const orderStop = await this.prisma.orderStop.findUnique({
//         where: { id: orderStopId },
//       });
  
//       if (!orderStop || orderStop.orderId !== orderId) {
//         throw new BadRequestException('Order stop not found');
//       }
  
//       // Delete stop (cascades to payment)
//       await this.prisma.orderStop.delete({ where: { id: orderStopId } });
  
//       // Resequence remaining stops
//       const remainingStops = await this.prisma.orderStop.findMany({
//         where: { orderId },
//         orderBy: { sequence: 'asc' },
//       });
  
//       for (let i = 0; i < remainingStops.length; i++) {
//         await this.prisma.orderStop.update({
//           where: { id: remainingStops[i].id },
//           data: { sequence: i + 1 },
//         });
//       }
  
//       // Recalculate price
//       await this.recalculateOrderPrice(orderId);
  
//       return { message: 'Destination removed from order' };
//     }


//   async placeOrder(
//     orderId: number,
//     userId: number,
//     dto: {
//       paymentMethod?: PayType;
//       paymentMethodId?: string;
//       codCollectFrom?: 'SENDER' | 'RECEIVER'
//     },
//   ) {
//     const order = await this.prisma.order.findUnique({
//       where: { id: orderId },
//       include: {
//         vehicle: {
//           select: {
//             vehicle_type: true,
//             id: true,
//           }
//         },
//         delivery_type: {
//           select: {
//             id: true,
//             name: true,

//           }
//         },
//         orderStops: {
//           include: { payment: true },
//           orderBy: { sequence: 'asc' },
//         },
//       },
//     });

//     if (!order || order.userId !== userId) {
//       throw new BadRequestException('Order not found or unauthorized');
//     }

//     // 
//     if (order.order_status !== OrderStatus.PROGRESS) {
//       throw new BadRequestException('Order already placed');
//     }
//     // 
//     // Validate order has stops
//     const pickupStop = order.orderStops.find(s => s.type === StopType.PICKUP);
//     const dropStops = order.orderStops.filter(s => s.type === StopType.DROP);

//     if (!pickupStop || dropStops.length === 0) {
//       throw new BadRequestException('Order must have at least 1 pickup and 1 drop location');
//     }

//     const payType = dto.paymentMethod ?? order.pay_type ?? PayType.COD;
//     const codCollectFrom = dto.codCollectFrom ?? 'RECEIVER';
//     // 
//     const placeRes = await this.prisma.$transaction(async (tx) => {
//       /** ----------------------- UPFRONT PAYMENT ----------------------- */
//       if (payType === PayType.WALLET) {
//         const user = await tx.user.findUnique({ where: { id: userId } });

//         if (!user || Number(user.currentWalletBalance) < Number(order.total_cost)) {
//           throw new BadRequestException('Insufficient wallet balance');
//         }

//         await tx.user.update({
//           where: { id: userId },
//           data: { currentWalletBalance: { decrement: Number(order.total_cost) } },
//         });

//         // Mark all stops as PAID
//         await tx.stopPayment.updateMany({
//           where: { orderStopId: { in: order.orderStops.map(s => s.id) } },
//           data: {
//             payType: PayType.WALLET,
//             status: PaymentStatus.PAID,
//             amount: 0,
//           },
//         });
//       }

//       if (payType === PayType.ONLINE_PAY) {
//         if (!dto.paymentMethodId) {
//           throw new BadRequestException('Payment method ID required');
//         }

//         const paid = await this.walletService.addMoney(
//           userId,
//           Number(order.total_cost),
//           dto.paymentMethodId
//         );

//         if (!paid) throw new BadRequestException('Online payment failed');

//         await tx.stopPayment.updateMany({
//           where: { orderStopId: { in: order.orderStops.map(s => s.id) } },
//           data: {
//             payType: PayType.ONLINE_PAY,
//             status: PaymentStatus.PAID,
//             amount: 0,
//           },
//         });
//       }

//       /** ----------------------- COD PAYMENT SETUP ----------------------- */
//       if (payType === PayType.COD) {
//         if (codCollectFrom === 'SENDER') {
//           // Sender pays at pickup
//           await tx.stopPayment.update({
//             where: { orderStopId: pickupStop.id },
//             data: {
//               amount: Number(order.total_cost),
//               payType: PayType.COD,
//               status: PaymentStatus.UNPAID,
//             },
//           });
//           // Receivers pay nothing
//           for (const drop of dropStops) {
//             await tx.stopPayment.update({
//               where: { orderStopId: drop.id },
//               data: { amount: 0, status: PaymentStatus.PAID },
//             });
//           }
//         } else {
//           // Each receiver pays
//           const perDropAmount = Number(order.total_cost) / dropStops.length;

//           // Sender pays nothing
//           await tx.stopPayment.update({
//             where: { orderStopId: pickupStop.id },
//             data: { amount: 0, status: PaymentStatus.PAID },
//           });

//           // Each receiver pays their share
//           for (const drop of dropStops) {
//             await tx.stopPayment.update({
//               where: { orderStopId: drop.id },
//               data: {
//                 amount: perDropAmount,
//                 payType: PayType.COD,
//                 status: PaymentStatus.UNPAID,
//               },
//             });
//           }
//         }
//       }

//       /** ----------------------- UPDATE ORDER ----------------------- */
//       const updatedOrder = await tx.order.update({
//         where: { id: orderId },
//         data: {
//           order_status: OrderStatus.PENDING,
//           is_placed: true,
//           pay_type: payType,
//         },
//         include: {
//           orderStops: {
//             include: {
//               destination: true,
//               payment: true,
//             },
//             orderBy: { sequence: 'asc' },
//           },
//         },
//       });
//       // 
//       if (order.notify_favorite_raider === true) {
//         //  
//         const favRaiders = await tx.myRaider.findMany({
//           where: {
//             user_id: userId,
//             is_fav: true,
//           },
//           select: {
//             raiderId: true,
//             user_id: true,
//             is_fav: true,
//             user: {
//               select: {
//                 username: true,
//                 id: true,
//                 email: true
//               }
//             }
//           }
//         })
//         // Send notification to rider
//         if (favRaiders.length > 0) {
//           // 
//           for (const rider of favRaiders) {
//             await this.raiderGateway.notifyUserFavRaider(
//               rider.raiderId,
//               orderId,
//               rider.user.username,
//               {
//                 orderId: order.id,
//                 totalOrderCost: String(order.total_cost),
//                 totalFee: String(order.total_fee),
//                 vehicleType: order.vehicle!,
//                 deliveryType: order.delivery_type.name,
//                 orderStop: order.orderStops
//               },
//             )
//           }
//         }

//       }
//       // 
//       return updatedOrder;

//     });
//     const isUserExist = await this.prisma.user.findUnique({ where: { id: userId } });
//     if (isUserExist) {
//       // Send notification to user
//       await this.emailQueueService.queueOrderStatusNotification({
//         userId: isUserExist.id,
//         fcmToken: isUserExist?.fcmToken ?? '',
//         orderId: placeRes.id,
//         orderNumber: `ORD-${String(placeRes.id).padStart(6, '0')}`,
//         status: NotificationType.ORDER_UPDATE,
//         title: 'Order Placed Successfully',
//         message: `Your order ORD-${String(placeRes.id).padStart(6, '0')} has been placed with total cost $${placeRes.total_cost.toFixed(2)}.`,
//       });
//     }
//     // 
//     return placeRes;

//   }


//   async updateOrderDetails(
//     orderId: number,
//     userId: number,
//     dto: UpdateOrderDetailsDto,
//   ) {
//     const order = await this.prisma.order.findUnique({
//       where: { id: orderId, userId },
//     });

//     if (!order) throw new NotFoundException('Order not found');

//     if (order.order_status !== OrderStatus.PROGRESS) {
//       throw new BadRequestException('Cannot update placed order');
//     }
//     // checking if vehicle type not avilable on delivery type  
//     if (dto.vehicle_type_id !== undefined) {
//       const deliveryType = await this.prisma.deliveryType.findUnique({
//         where: { id: dto.delivery_type_id },
//       });
//       if (!deliveryType) {
//         throw new BadRequestException('Delivery type not found');
//       }
//       const vehicleType = await this.prisma.vehicleType.findUnique({
//         where: { id: dto.vehicle_type_id },
//         include: {
//           delivery_types: true,
//         }
//       });
//       if (!vehicleType) {
//         throw new BadRequestException('Vehicle type not found');
//       }
//       if (!vehicleType.delivery_types.some((item) => item.delivery_type_id === dto.delivery_type_id)) {
//         throw new BadRequestException('Vehicle type not available for this delivery type');
//       }
//     }
//     // Track if price needs recalculation
//     const needsRecalculation =
//       dto.delivery_type_id !== undefined ||
//       dto.isFixed !== undefined ||
//       dto.vehicle_type_id !== undefined ||
//       dto.route_type !== undefined ||
//       dto.scheduled_time !== undefined;

//     // Update order
//     await this.prisma.order.update({
//       where: { id: orderId },
//       data: {
//         ...(dto.delivery_type_id !== undefined && { delivery_type_id: dto.delivery_type_id }),
//         ...(dto.isFixed !== undefined && { isFixed: dto.isFixed }),
//         ...(dto.route_type !== undefined && { route_type: dto.route_type }),
//         ...(dto.collect_time !== undefined && { collect_time: dto.collect_time }),
//         ...(dto.scheduled_time !== undefined && { scheduled_time: dto.scheduled_time }),
//         ...(dto.vehicle_type_id !== undefined && { vehicle_type_id: dto.vehicle_type_id }),
//       },
//     });

//     // Recalculate price if relevant fields changed
//     if (needsRecalculation) {
//       await this.recalculateOrderPrice(orderId);
//     }

//     return await this.getOrderDetails(orderId);
//   }


  //  async getOrderDetails(orderId: number) {
  //     const order = await this.prisma.order.findUnique({
  //       where: { id: orderId },
  //       include: {
  //         delivery_type: {
  //           include: {
  //             vehicle_types: {
  //               include: { vehicle_type: true },
  //             },
  //           },
  //         },
  //         user: true,
  //         orderStops: {
  //           include: {
  //             destination: true,
  //             payment: true,
  //           },
  //           orderBy: { sequence: 'asc' },
  //         },
  //         assign_rider: {
  //           include: {
  //             registrations: {
  //               select: {
  //                 id: true,
  //                 raider_name: true,
  //                 contact_number: true,
  //                 email_address: true,
  //                 current_postal_code: true,
  //                 current_unit: true,
  //                 current_address: true,
  //                 current_country: true,
  //                 driver_photos: true,
  //               },
  //             },
  //             locations: true,
  //           },
  //         },
  //       },
  //     });

  //     if (!order) throw new NotFoundException('Order not found');

  //     const pickupStop = order.orderStops.find((s) => s.type === StopType.PICKUP);
  //     const dropStops = order.orderStops.filter((s) => s.type === StopType.DROP);

  //     // Calculate average rating for assigned raider
  //     const avgRating = await this.prisma.rateRaider.aggregate({
  //       where: { raiderId: order.assign_rider_id },
  //       _avg: { rating_star: true },
  //       _count: { id: true },
  //     });

  //     const formattedAverage = avgRating._avg.rating_star
  //       ? Number(avgRating._avg.rating_star.toFixed(2))
  //       : 5;

  //     let pricingResults: ReceiverWithPricing[] = [];
  //     let totalDistance = 0;

  //     // MAIN LOGIC: Calculate individual pricing with Surge + Driver Earnings
  //     if (pickupStop && dropStops.length > 0) {
  //       const zone = await this.serviceZone.findZoneByPoint(
  //         pickupStop.latitude,
  //         pickupStop.longitude,
  //       );

  //       if (zone) {
  //         const sender = {
  //           lat: pickupStop.latitude,
  //           lng: pickupStop.longitude,
  //         };

  //         const receivers = dropStops.map((s) => ({
  //           lat: s.latitude,
  //           lng: s.longitude,
  //         }));

  //         const [demand, availableDrivers] = await Promise.all([
  //           this.getCurrentDemand(zone.id),
  //           this.getAvailableDrivers(zone.id),
  //         ]);

  //         try {
  //           pricingResults = await getReceiversWithIndividualPrice(
  //             this.prisma,
  //             this.surgePricingRuleService,
  //             sender,
  //             receivers,
  //             order.delivery_type_id,
  //             order.vehicle_type_id ?? 1,
  //             zone,
  //             { isRoundTrip: order.route_type === RouteType.ROUND },
  //             demand,
  //             availableDrivers,
  //           );

  //           totalDistance = pricingResults.reduce(
  //             (total, result) => total + result.distanceKm,
  //             0,
  //           );
  //         } catch (error) {
  //           console.error('Pricing calculation failed:', error);
  //           pricingResults = []; 
  //         }
  //       }
  //     }

  //     // FALLBACK: No stops yet, outside zone, or pricing failed → use stored DB values
  //     if (pricingResults.length === 0) {
  //       return {
  //         ...order,
  //         formattedAverage,
  //         pricingSummary: {
  //           totalDistance: Number(Number(order.total_distance ?? 0).toFixed(2)),
  //           totalCost: Number(Number(order.total_cost ?? 0).toFixed(2)),
  //           totalFee: Number(Number(order.total_fee ?? 0).toFixed(2)),
  //           totalRaiderEarnings: Number(Number(order.total_raider_earnings ?? 0).toFixed(2)),
  //           totalPlatformFee: 0,
  //           basePrice: 0,
  //           deliveryTypeCharge: 0,
  //           additionServiceFee: Number(order.additional_cost ?? 0),
  //           dropCount: dropStops.length,
  //           surgeApplied: false,
  //           perDropBreakdown: dropStops.map((s) => ({
  //             price: Number(Number(s.payment?.amount ?? 0).toFixed(2)),
  //             raiderEarnings: Number(Number(s.payment?.amount ?? 0).toFixed(2)),
  //             distance: 0,
  //             surgeMultiplier: 1,
  //           })),
  //         },
  //       };
  //     }

  //     // Calculate totals from live pricing results
  //     const totalCost = pricingResults.reduce((sum, r) => sum + r.pricing.totalPrice, 0);
  //     const totalFee = pricingResults.reduce((sum, r) => sum + r.pricing.totalFee, 0);
  //     const totalRaiderEarnings = pricingResults.reduce((sum, r) => sum + r.pricing.raiderEarnings, 0);
  //     const totalPlatformFee = pricingResults.reduce((sum, r) => sum + r.pricing.platformFee, 0);
  //     const basePrice = pricingResults[0]?.pricing.basePrice ?? 0;
  //     const deliveryTypeCharge = pricingResults.reduce(
  //       (sum, r) => sum + r.pricing.deliveryTypeCharge,
  //       0,
  //     );

  //     return {
  //       ...order,
  //       formattedAverage,
  //       pricingSummary: {
  //         totalDistance: Number(totalDistance.toFixed(2)),
  //         totalCost: Number(totalCost.toFixed(2)),
  //         totalFee: Number(totalFee.toFixed(2)),
  //         totalRaiderEarnings: Number(totalRaiderEarnings.toFixed(2)),
  //         totalPlatformFee: Number(totalPlatformFee.toFixed(2)),
  //         basePrice: Number(basePrice.toFixed(2)),
  //         deliveryTypeCharge: Number(deliveryTypeCharge.toFixed(2)),
  //         additionServiceFee: Number(order.additional_cost ?? 0),
  //         dropCount: dropStops.length,
  //         surgeApplied: pricingResults.some((r) => r.pricing.surgeMultiplier > 1),
  //         perDropBreakdown: pricingResults.map((r) => ({
  //           price: Number(r.pricing.totalPrice.toFixed(2)),
  //           raiderEarnings: Number(r.pricing.raiderEarnings.toFixed(2)),
  //           distance: Number(r.distanceKm.toFixed(2)),
  //           surgeMultiplier: r.pricing.surgeMultiplier,
  //         })),
  //       },
  //     };
  //   }