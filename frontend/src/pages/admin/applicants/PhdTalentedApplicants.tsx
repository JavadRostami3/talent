import ApplicantsList from './ApplicantsList';

const PhdTalentedApplicants = () => {
  return (
    <ApplicantsList
      roundType="PHD_TALENT"
      title="پرونده‌های استعدادهای درخشان (دکتری)"
      description="لیست متقاضیان استعدادهای درخشان در مقطع دکتری و وضعیت بررسی پرونده‌های آنان"
      showRankFilter={true}
    />
  );
};

export default PhdTalentedApplicants;



