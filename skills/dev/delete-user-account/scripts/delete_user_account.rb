# frozen_string_literal: true

# Operator account-deletion tool.
#
# Thin wrapper over UserAccountDeletionService — the single, schema-guarded,
# FK-safe deletion path shared with the self-serve teacher/parent endpoints.
# Operators run with force: true, which bypasses the self-serve obligation gate
# (so an account with teaching/financial history can still be erased, e.g. GDPR).
#
# Usage:
#   # Dry run (shows what would be deleted):
#   rails runner scripts/delete_user_account.rb email@example.com
#
#   # Actually delete:
#   rails runner scripts/delete_user_account.rb email@example.com --confirm
#
#   # Production:
#   RAILS_ENV=production rails runner scripts/delete_user_account.rb email@example.com --confirm

email = ARGV[0]
confirm = ARGV.include?("--confirm")

if email.nil? || email.start_with?("--")
  puts "Usage: rails runner scripts/delete_user_account.rb EMAIL [--confirm]"
  exit 1
end

user = User.find_by(email: email.downcase.strip)
unless user
  puts "ERROR: No user found with email '#{email}'"
  exit 1
end

conn = ActiveRecord::Base.connection
profile_ids = user.profiles.pluck(:id)

puts "=" * 60
puts confirm ? "LIVE RUN - data will be PERMANENTLY deleted" : "DRY RUN - No data will be deleted"
puts "=" * 60
puts "  User ID: #{user.id}"
puts "  Email:   #{user.email}"
puts "  Created: #{user.created_at}"
user.profiles.each do |p|
  type = p.parent? ? "parent" : (p.teacher? ? "teacher" : "other")
  puts "  Profile: #{p.id} (#{p.profile_type} #{type}) #{p.first_name} #{p.last_name}"
end
puts ""

# Self-serve would block these; the operator run bypasses the gate.
obligations = UserAccountDeletionService.new(user).blocking_obligations
if obligations.any?
  puts "NOTE: self-serve deletion WOULD BE BLOCKED for this account:"
  obligations.each { |reason| puts "  - #{reason}" }
  puts "(this operator run bypasses the gate and force-deletes everything)"
  puts ""
end

# Footprint derived from the SAME coverage map the service deletes by, so the
# dry-run report can never drift from what the deletion actually does.
puts "DEPENDENCIES (#{confirm ? 'being cleared' : 'to be cleared'}):"
any = false
UserAccountDeletionService::COVERED_FKS.each do |fk|
  ids = fk[:scope] == :user ? [user.id] : profile_ids
  next if ids.empty?

  list = ids.map { |id| conn.quote(id) }.join(",")
  count = conn.select_value("SELECT COUNT(*) FROM #{fk[:table]} WHERE #{fk[:column]} IN (#{list})").to_i
  next if count.zero?

  any = true
  puts "  #{fk[:policy].to_s.upcase.ljust(8)} #{fk[:table]}.#{fk[:column]}: #{count}"
end
puts "  (none)" unless any
puts ""

unless confirm
  puts "To actually delete this account, run:"
  puts "  RAILS_ENV=#{Rails.env} rails runner scripts/delete_user_account.rb #{email} --confirm"
  exit 0
end

puts "Proceeding with deletion..."
result = UserAccountDeletionService.new(user, force: true).call

puts ""
puts "=" * 60
if result.ok?
  puts "ACCOUNT DELETED SUCCESSFULLY"
else
  puts "DELETION DID NOT COMPLETE (status: #{result.status})"
end
puts "=" * 60
puts ""
puts "DELETION SUMMARY:"
result.deleted_counts.sort.each { |table, n| puts "  #{table}: #{n}" }

# Verify the user row is actually gone.
still_there = User.exists?(user.id)
puts ""
puts(still_there ? "WARNING: user #{user.id} still exists!" : "VERIFIED: user #{user.id} deleted")

exit(result.ok? && !still_there ? 0 : 1)
