import { FeedbackThreads } from '../../components/feedback-threads';

export default function CompanyFeedbackScreen() {
  return (
    <FeedbackThreads
      title="Geri Bildirim"
      subtitle="Personel geri bildirimlerini yanıtlayın"
      allowCreate={false}
      allowClose
      threadMeta={(t) =>
        t.createdBy
          ? `${t.createdBy.firstName} ${t.createdBy.lastName}${t.createdBy.publicId ? ` · ${t.createdBy.publicId}` : ''}`
          : undefined
      }
    />
  );
}
