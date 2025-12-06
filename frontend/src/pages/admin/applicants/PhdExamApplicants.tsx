import ApplicantsList from './ApplicantsList';

const PhdExamApplicants = () => {
  return (
    <ApplicantsList
      roundType="PHD_EXAM"
      title="پرونده‌های آزمون دکتری"
      description="لیست متقاضیان آزمون دکتری و وضعیت بررسی پرونده‌های آنان"
      showRankFilter={false}
    />
  );
};

export default PhdExamApplicants;


