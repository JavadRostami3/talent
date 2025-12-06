import ApplicantsList from './ApplicantsList';

const OlympiadApplicants = () => {
  return (
    <ApplicantsList
      roundType="OLYMPIAD"
      title="پرونده‌های المپیادی"
      description="لیست متقاضیان المپیادی و وضعیت بررسی پرونده‌های آنان"
      showRankFilter={false}
    />
  );
};

export default OlympiadApplicants;


