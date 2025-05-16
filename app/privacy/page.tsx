import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function PrivacyPage() {
  return (
    <div className="container py-12">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">Privacy Policy</CardTitle>
          <CardDescription>Last updated: May 16, 2025</CardDescription>
        </CardHeader>
        <CardContent className="prose dark:prose-invert max-w-none">
          <h2>1. Introduction</h2>
          <p>
            This Privacy Policy explains how the Lost and Found Portal for Saveetha Engineering College collects, uses,
            and discloses your information when you use our service.
          </p>

          <h2>2. Information We Collect</h2>
          <p>We collect the following types of information:</p>
          <ul>
            <li>
              <strong>Account Information:</strong> Email address and password
            </li>
            <li>
              <strong>Profile Information:</strong> Name and phone number
            </li>
            <li>
              <strong>Item Information:</strong> Details about lost or found items, including descriptions, images, and
              locations
            </li>
            <li>
              <strong>Usage Information:</strong> How you interact with our service
            </li>
          </ul>

          <h2>3. How We Use Your Information</h2>
          <p>We use your information to:</p>
          <ul>
            <li>Provide and maintain our service</li>
            <li>Notify you about changes to our service</li>
            <li>Allow you to participate in interactive features of our service</li>
            <li>Provide customer support</li>
            <li>Monitor the usage of our service</li>
            <li>Detect, prevent, and address technical issues</li>
          </ul>

          <h2>4. Data Retention</h2>
          <p>
            We will retain your information only for as long as is necessary for the purposes set out in this Privacy
            Policy. We will retain and use your information to the extent necessary to comply with our legal
            obligations, resolve disputes, and enforce our policies.
          </p>

          <h2>5. Data Security</h2>
          <p>
            We implement appropriate technical and organizational measures to protect your personal information against
            unauthorized or unlawful processing and against accidental loss, destruction, or damage.
          </p>

          <h2>6. Your Rights</h2>
          <p>You have the right to:</p>
          <ul>
            <li>Access the personal information we hold about you</li>
            <li>Request correction of your personal information</li>
            <li>Request deletion of your personal information</li>
            <li>Object to processing of your personal information</li>
            <li>Request restriction of processing your personal information</li>
            <li>Request transfer of your personal information</li>
            <li>Withdraw consent</li>
          </ul>

          <h2>7. Changes to This Privacy Policy</h2>
          <p>
            We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new
            Privacy Policy on this page and updating the "Last Updated" date.
          </p>

          <h2>8. Contact Us</h2>
          <p>If you have any questions about this Privacy Policy, please contact us at lostandfound@saveetha.ac.in.</p>
        </CardContent>
      </Card>
    </div>
  )
}
