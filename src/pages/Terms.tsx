/**
 * Terms of Service - Static page
 */

export default function Terms() {
  return (
    <div className="container mx-auto py-12 px-4 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
      <div className="prose prose-neutral dark:prose-invert max-w-none">
        <p className="text-lg text-muted-foreground mb-6">
          Last updated: {new Date().toLocaleDateString()}
        </p>
        
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Acceptance of Terms</h2>
          <p>
            By accessing or using our services, you agree to be bound by these Terms of Service
            and all applicable laws and regulations.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">User Accounts</h2>
          <p>
            You are responsible for maintaining the confidentiality of your account credentials
            and for all activities that occur under your account.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Acceptable Use</h2>
          <p>
            You agree not to use our services for any unlawful purpose or in any way that
            could damage, disable, or impair our platform.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Content Ownership</h2>
          <p>
            You retain ownership of content you create and share. By posting content,
            you grant us a license to use, display, and distribute your content on our platform.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Termination</h2>
          <p>
            We reserve the right to suspend or terminate your account for violations
            of these terms or for any other reason at our discretion.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Contact</h2>
          <p>
            For questions about these Terms, please contact us at legal@example.com.
          </p>
        </section>
      </div>
    </div>
  );
}
