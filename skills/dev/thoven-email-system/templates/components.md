# Email Components

Copy-paste these into HTML templates. All follow Thoven brand standards.

---

## Info Box

Amber background box for highlighted information.

```html
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 0 0 32px 0;">
  <tr>
    <td style="background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 16px; padding: 28px;">
      <h2 class="fredoka" style="margin: 0 0 20px 0; font-family: 'Fredoka', 'Trebuchet MS', 'Lucida Grande', -apple-system, 'Segoe UI', sans-serif; font-size: 18px; font-weight: 600; color: #b45309; letter-spacing: -0.2px;">
        <!-- BOX TITLE -->
      </h2>
      <p style="margin: 0; font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.6; color: #4b5563;">
        <!-- BOX CONTENT -->
      </p>
    </td>
  </tr>
</table>
```

---

## Primary CTA Button

Orange button with Outlook VML fallback.

```html
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 0 0 24px 0;">
  <tr>
    <td align="center">
      <!--[if mso]>
      <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="<%= @url %>" style="height:56px;v-text-anchor:middle;width:260px;" arcsize="14%" strokecolor="#b45309" fillcolor="#ff8c1a">
        <w:anchorlock/>
        <center style="color:#ffffff;font-family:'Trebuchet MS',Arial,sans-serif;font-size:18px;font-weight:bold;"><!-- BUTTON TEXT --></center>
      </v:roundrect>
      <![endif]-->
      <!--[if !mso]><!-->
      <a href="<%= @url %>" target="_blank" rel="noopener" style="display: inline-block; background-color: #ff8c1a; color: #ffffff; text-decoration: none; font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 17px; font-weight: 700; padding: 18px 48px; border-radius: 12px; border-bottom: 4px solid #b45309; mso-padding-alt: 0; letter-spacing: 0.3px;" aria-label="<!-- ARIA LABEL -->">
        <!-- BUTTON TEXT -->
      </a>
      <!--<![endif]-->
    </td>
  </tr>
</table>
```

---

## Secondary Button

White button with orange border and Outlook VML fallback.

```html
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 0 0 24px 0;">
  <tr>
    <td align="center">
      <!--[if mso]>
      <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="<%= @url %>" style="height:56px;v-text-anchor:middle;width:260px;" arcsize="14%" strokecolor="#ff8c1a" fillcolor="#ffffff">
        <w:anchorlock/>
        <center style="color:#ff8c1a;font-family:'Trebuchet MS',Arial,sans-serif;font-size:18px;font-weight:bold;"><!-- BUTTON TEXT --></center>
      </v:roundrect>
      <![endif]-->
      <!--[if !mso]><!-->
      <a href="<%= @url %>" target="_blank" rel="noopener" style="display: inline-block; background-color: #ffffff; color: #ff8c1a; text-decoration: none; font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 17px; font-weight: 700; padding: 18px 48px; border-radius: 12px; border: 2px solid #ff8c1a; mso-padding-alt: 0; letter-spacing: 0.3px;" aria-label="<!-- ARIA LABEL -->">
        <!-- BUTTON TEXT -->
      </a>
      <!--<![endif]-->
    </td>
  </tr>
</table>
```

---

## Bullet List

Orange bullet points with proper spacing.

```html
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
  <tr>
    <td style="padding: 10px 0 10px 0; font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.7; color: #4b5563;">
      <span style="color: #ff8c1a; font-weight: 600;">&#8226;</span>&nbsp;&nbsp;&nbsp;Bullet item text
    </td>
  </tr>
  <!-- Repeat <tr> for each bullet -->
</table>
```

---

## Slot Iteration Block

For listing lesson dates/times inside an Info Box.

```html
<% @slots.each_with_index do |slot, index| %>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
  <tr>
    <td style="padding: 10px 0; font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.6; color: #4b5563;<%= index < @slots.length - 1 ? ' border-bottom: 1px solid #fef3c7;' : '' %>">
      <strong style="color: #1f2937; font-weight: 600;"><%= slot[:date] %></strong><br>
      <span style="color: #6b7280;"><%= slot[:time] %></span>
      <span style="color: #9ca3af; margin-left: 8px;">(<%= slot[:duration] %> min)</span>
    </td>
  </tr>
</table>
<% end %>
```

---

## Urgency Callout

Amber background, centered text for time-sensitive info.

```html
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 0 0 32px 0;">
  <tr>
    <td style="background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 12px; padding: 16px 20px;">
      <p style="margin: 0; font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.6; color: #92400e; text-align: center;">
        <strong><!-- URGENCY TEXT --></strong>
      </p>
    </td>
  </tr>
</table>
```
