import { BigDecimal, BigInt, log, ethereum, Bytes } from '@graphprotocol/graph-ts'
import { 
  ContributionMade,
  ApprovalSubmitted,
  ProjectApproved,
  ProjectCompleted,
  MilestoneApprovalSubmitted,
  MilestoneApproved,
  MilestoneCompleted,
  RewardClaimed,
  ProjectCancelled,
  ProjectExpired
} from '../generated/templates/Project/Project'
import { Project, Milestone, Activity, Contributor } from '../generated/schema'

function createActivity(
    event: ethereum.Event,
    type: string,
    from: Bytes | null = null,
    amount: BigInt | null = null,
    balance: BigInt | null = null
): void {
    let activity = new Activity(
        event.transaction.hash.toHexString() + '-' + event.logIndex.toString()
    )
    activity.project = event.address.toHexString()
    activity.type = type
    activity.from = from
    activity.amount = amount
    activity.balance = balance
    activity.timestamp = event.block.timestamp
    activity.save()
}

export function handleContributionMade(event: ContributionMade): void {
    let project = Project.load(event.address.toHexString())
    if (!project) {
        log.warning('Project not found for address: {}', [event.address.toHexString()])
        return
    }

    project.contributorsCount = event.params.contributorsCount
    project.currentBalance = event.params.currentBalance

    // Update progress ratio
    if (project.targetContribution.gt(BigInt.fromI32(0))) {
        project.progressRatio = project.currentBalance.toBigDecimal()
            .div(project.targetContribution.toBigDecimal())
    }

    // Update trending score
    let now = event.block.timestamp
    let timeElapsed = now.minus(project.createdAt)
    if (timeElapsed.gt(BigInt.fromI32(0))) {
        project.trendingScore = project.currentBalance.toBigDecimal()
            .div(timeElapsed.toBigDecimal())
    }
    project.save()

    // Create or update contributor
    let contributorId = event.address.toHexString() + '-' + event.params.contributor.toHexString()
    let contributor = Contributor.load(contributorId)
    if (!contributor) {
        contributor = new Contributor(contributorId)
        contributor.project = project.id
        contributor.address = event.params.contributor
    }
    contributor.amount = event.params.amount
    contributor.timestamp = event.params.timestamp
    contributor.save()

    createActivity(
        event,
        'CONTRIBUTION',
        event.params.contributor,
        event.params.amount,
        event.params.currentBalance
    )
}

export function handleApprovalSubmitted(event: ApprovalSubmitted): void {
    let project = Project.load(event.address.toHexString())
    if (!project) return

    project.approvalsCount = event.params.approvalsCount
    project.save()

    createActivity(
        event,
        'APPROVAL_SUBMITTED',
        event.params.approver,
        null,
        null
    )
}

export function handleProjectApproved(event: ProjectApproved): void {
    let project = Project.load(event.address.toHexString())
    if (!project) return

    project.approved = true
    project.approvedAt = event.params.timestamp
    project.save()

    createActivity(
        event,
        'PROJECT_APPROVED',
        null,
        null,
        null
    )
}

export function handleProjectCompleted(event: ProjectCompleted): void {
    let project = Project.load(event.address.toHexString())
    if (!project) return

    project.completed = true
    project.completedAt = event.params.timestamp
    project.save()

    createActivity(
        event,
        'PROJECT_COMPLETED',
        event.params.recipient,
        event.params.amount,
        null
    )
}

export function handleProjectCancelled(event: ProjectCancelled): void {
    let project = Project.load(event.address.toHexString())
    if (!project) return

    project.cancelled = true
    project.cancelledAt = event.params.timestamp
    project.save()

    createActivity(
        event,
        'PROJECT_CANCELLED',
        event.params.canceller,
        null,
        event.params.balance
    )
}

export function handleProjectExpired(event: ProjectExpired): void {
    let project = Project.load(event.address.toHexString())
    if (!project) return

    project.cancelled = true
    project.cancelledAt = event.params.timestamp
    project.save()

    createActivity(
        event,
        'PROJECT_EXPIRED',
        null,
        null,
        event.params.balance
    )
}

export function handleMilestoneApprovalSubmitted(event: MilestoneApprovalSubmitted): void {
    let milestoneId = event.address.toHexString() + '-' + event.params.milestoneIndex.toString()
    let milestone = Milestone.load(milestoneId)
    if (!milestone) return

    milestone.approvalsCount = event.params.approvalsCount
    milestone.save()

    createActivity(
        event,
        'MILESTONE_APPROVAL_SUBMITTED',
        event.params.approver,
        null,
        null
    )
}

export function handleMilestoneApproved(event: MilestoneApproved): void {
    let milestoneId = event.address.toHexString() + '-' + event.params.milestoneIndex.toString()
    let milestone = Milestone.load(milestoneId)
    if (!milestone) return

    milestone.approved = true
    milestone.approvedAt = event.params.timestamp
    milestone.save()

    createActivity(
        event,
        'MILESTONE_APPROVED',
        null,
        null,
        null
    )
}

export function handleMilestoneCompleted(event: MilestoneCompleted): void {
    let milestoneId = event.address.toHexString() + '-' + event.params.milestoneIndex.toString()
    let milestone = Milestone.load(milestoneId)
    if (!milestone) return

    milestone.completed = true
    milestone.completedAt = event.params.timestamp
    milestone.save()

    createActivity(
        event,
        'MILESTONE_COMPLETED',
        event.params.recipient,
        event.params.amount,
        null
    )
}

export function handleRewardClaimed(event: RewardClaimed): void {
    createActivity(
        event,
        'REWARD_CLAIMED',
        event.params.contributor,
        null,
        null
    )
}