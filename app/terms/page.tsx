import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function TermsPage() {
  return (
    <div className="container py-12">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">Terms of Service</CardTitle>
          <CardDescription>Last updated: May 16, 2025</CardDescription>
        </CardHeader>
        <CardContent className="prose dark:prose-invert max-w-none">
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing or using the Lost and Found Portal for Saveetha Engineering College, you agree to be bound by
            these Terms of Service. If you do not agree to these terms, please do not use the service.
          </p>

          <h2>2. Description of Service</h2>
          <p>
            The Lost and Found Portal is a platform designed to help Saveetha Engineering College students and staff
            report lost items and find items that have been found on campus.
          </p>

          <h2>3. User Accounts</h2>
          <p>
            To use certain features of the service, you must register for an account. You are responsible for
            maintaining the confidentiality of your account information and for all activities that occur under your
            account.
          </p>

          <h2>4. User Conduct</h2>
          <p>You agree not to:</p>
          <ul>
            <li>Post false, misleading, or fraudulent information</li>
            <li>Impersonate any person or entity</li>
            <li>Use the service for any illegal purpose</li>
            <li>Interfere with the proper functioning of the service</li>
            <li>Attempt to gain unauthorized access to the service or its related systems</li>
          </ul>

          <h2>5. Content Submission</h2>
          <p>
            By submitting content to the Lost and Found Portal, you grant Saveetha Engineering College a non-exclusive,
            royalty-free license to use, modify, and display the content in connection with the service.
          </p>

          <h2>6. Privacy</h2>
          <p>
            Your use of the service is also governed by our Privacy Policy, which is incorporated by reference into
            these Terms of Service.
          </p>

          <h2>7. Termination</h2>
          <p>
            We reserve the right to terminate or suspend your account and access to the service at our sole discretion,
            without notice, for conduct that we believe violates these Terms of Service or is harmful to other users of
            the service, us, or third parties, or for any other reason.
          </p>

          <h2>8. Disclaimer of Warranties</h2>
          <p>
            The service is provided "as is" and "as available" without warranties of any kind, either express or
            implied.
          </p>

          <h2>9. Limitation of Liability</h2>
          <p>
            In no event shall Saveetha Engineering College, its officers, directors, employees, or agents be liable for
            any indirect, incidental, special, consequential, or punitive damages arising out of or relating to your use
            of the service.
          </p>

          <h2>10. Changes to Terms</h2>
          <p>
            We reserve the right to modify these Terms of Service at any time. We will provide notice of significant
            changes by posting the new Terms of Service on the service and updating the "Last Updated" date.
          </p>

          <h2>11. Contact Information</h2>
          <p>
            If you have any questions about these Terms of Service, please contact us at lostandfound@saveetha.ac.in.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
