import ApplicantsList from './ApplicantsList';

const MastersTalentedApplicants = () => {
  return (
    <ApplicantsList
      roundType="MA_TALENT"
      title="پرونده‌های استعدادهای درخشان (کارشناسی ارشد)"
      description="لیست متقاضیان استعدادهای درخشان در مقطع کارشناسی ارشد و وضعیت بررسی پرونده‌های آنان"
      showRankFilter={true}
    />
  );
};

export default MastersTalentedApplicants;