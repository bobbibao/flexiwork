// import { Injectable, Logger } from '@nestjs/common';
// import { CacheService } from './cache.service';
// import * as fastq from 'fastq';
// import type { queueAsPromised } from 'fastq';
// // import DownloadRequestDocuments from 'src/database/models/downloadrequestdocuments.model';
// // import { Document } from 'src/database/models/document.model';
// import { Op } from 'sequelize';
// import * as archiver from 'archiver';
// // import DownloadRequest from 'src/database/models/downloadrequest.model';
// import { BlobStorageService } from '../azure/blob.service';
// // import { IQueueZip } from 'src/modules/documents/dto/document.dto';

// @Injectable()
// export class QueueService {
//   constructor(
//     private cacheService: CacheService,
//     private readonly blobRepository: BlobStorageService,
//   ) {}

//   async addDownloadQueue(queue: IQueueZip) {
//     try {
//       const value = await this.cacheService.getConfigValue('QUEUE_CONCURRENCY');
//       const q: queueAsPromised<IQueueZip, void> = fastq.promise(
//         (queue) => this.downloadRequestWorker(queue),
//         value ? parseInt(value) : 1,
//       );
//       await q.push(queue);
//     } catch (error) {
//       Logger.error(error);
//       throw error;
//     }
//   }
//   // handle queue
//   async downloadRequestWorker(queue: IQueueZip) {
//     const removeSecondPath = (path: string) => {
//       const parts = path.split('/');
//       if (parts.length >= 2) {
//         parts.splice(1, 1);
//         return parts.join('/');
//       } else {
//         return path;
//       }
//     }
//     try {
//       const findAllDocumentIds = await DownloadRequestDocuments.findAll({
//         where: {
//           DownloadRequestId: queue.id,
//         },
//       });

//       if (!findAllDocumentIds.length) {
//         throw 'Download RequestId not found';
//       }
//       const listIds = findAllDocumentIds.map((item) => item.DocumentId);
//       const files = await Document.findAll({
//         where: {
//           Id: {
//             [Op.in]: listIds,
//           },
//           DocumentStatusId: 1,
//         },
//       });
//       const archive = archiver('zip', { zlib: { level: 9 } });
//       const requestDownload = await DownloadRequest.findByPk(queue.id);
//       for (const file of files) {
//         const fileData = await this.blobRepository.downloadBlobFileAsBuffer(file.StoragePath);
//         archive.append(fileData, { name: queue.clientScope === 'client.basicaccess' ? removeSecondPath(file.StoragePath) : file.StoragePath });
//       }
//       archive.finalize();

//       // 3.
//       const storagePath = `zipfile/${queue.id}-${requestDownload.Filename}`;
//       const current = new Date();

//       await this.blobRepository.uploadBlobStream(archive, storagePath);
//       // 4.
//       await DownloadRequest.update(
//         { StatusDate: current, Status: 'Ready', LinkDownload: storagePath },
//         {
//           where: {
//             Id: queue.id,
//           },
//         },
//       );
//     } catch (error) {
//       Logger.error(error);
//       const current = new Date();
//       await DownloadRequest.update(
//         { StatusDate: current, Status: 'Failed' },
//         {
//           where: {
//             Id: queue.id,
//           },
//         },
//       );
//     }
//   }
// }
