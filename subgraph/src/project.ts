import { BigDecimal, BigInt, log, ethereum } from '@graphprotocol/graph-ts'
import { 
  ContributionMade,
  ApprovalSubmitted,
  ProjectApproved,
  ProjectCompleted,
  MilestoneApprovalSubmitted,
  MilestoneApproved,
  MilestoneCompleted,
  RewardClaimed
} from '../generated/templates/Project/Project'
import { Project, Milestone, Activity } from '../generated/schema'

function createActivity(
    event: ethereum.Event,
    type: string,
    data: string
): void {
    let project = Project.load(event.address.toHexString())
    if (!project) {
        log.warning('Project not found for activity: {}', [event.address.toHexString()])
        return
    }

    let activity = new Activity(
        event.transaction.hash.toHexString() + '-' + event.logIndex.toString()
    )
    activity.project = event.address.toHexString()
    activity.type = type
    activity.actor = event.transaction.from
    activity.data = data
    activity.timestamp = event.block.timestamp
    activity.blockNumber = event.block.number
    activity.save()
}

export function handleContributionMade(event: ContributionMade): void {
    let project = Project.load(event.address.toHexString())
    if (!project) {
        log.warning('Project not found for address: {}', [event.address.toHexString()])
        return
    }

    project.currentBalance = event.params.currentBalance
    project.contributorsCount = event.params.contributorsCount

    // Calculate progress ratio
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

    // Create activity
    createActivity(
        event,
        'CONTRIBUTION',
        `{"amount":"${event.params.amount.toString()}"}`
    )
}

export function handleApprovalSubmitted(event: ApprovalSubmitted): void {
    let project = Project.load(event.address.toHexString())
    if (project) {
        project.approvalsCount = event.params.approvalsCount
        project.save()
    }

    createActivity(
        event,
        'PROJECT_APPROVAL_SUBMITTED',
        `{"approvalsCount":"${event.params.approvalsCount.toString()}"}`
    )
}

export function handleProjectApproved(event: ProjectApproved): void {
    let project = Project.load(event.address.toHexString())
    if (project) {
        project.approved = true
        project.approvedAt = event.params.timestamp
        project.save()
    }

    createActivity(
        event,
        'PROJECT_APPROVED',
        '{}'
    )
}

export function handleProjectCompleted(event: ProjectCompleted): void {
    let project = Project.load(event.address.toHexString())
    if (project) {
        project.completed = true
        project.completedAt = event.params.timestamp
        project.save()
    }

    createActivity(
        event,
        'PROJECT_COMPLETED',
        `{"amount":"${event.params.amount.toString()}"}`
    )
}

export function handleMilestoneApprovalSubmitted(event: MilestoneApprovalSubmitted): void {
    let milestoneId = event.address.toHexString() + '-' + event.params.milestoneIndex.toString()
    let milestone = Milestone.load(milestoneId)
    if (milestone) {
        milestone.approvalsCount = event.params.approvalsCount
        milestone.save()
    }

    createActivity(
        event,
        'MILESTONE_APPROVAL_SUBMITTED',
        `{
            "milestoneIndex":"${event.params.milestoneIndex.toString()}",
            "approvalsCount":"${event.params.approvalsCount.toString()}"
        }`
    )
}

export function handleMilestoneApproved(event: MilestoneApproved): void {
    let milestoneId = event.address.toHexString() + '-' + event.params.milestoneIndex.toString()
    let milestone = Milestone.load(milestoneId)
    if (milestone) {
        milestone.approved = true
        milestone.approvedAt = event.params.timestamp
        milestone.save()
    }

    createActivity(
        event,
        'MILESTONE_APPROVED',
        `{"milestoneIndex":"${event.params.milestoneIndex.toString()}"}`
    )
}

export function handleMilestoneCompleted(event: MilestoneCompleted): void {
    let milestoneId = event.address.toHexString() + '-' + event.params.milestoneIndex.toString()
    let milestone = Milestone.load(milestoneId)
    if (milestone) {
        milestone.completed = true
        milestone.completedAt = event.params.timestamp
        milestone.save()
    }

    createActivity(
        event,
        'MILESTONE_COMPLETED',
        `{
            "milestoneIndex":"${event.params.milestoneIndex.toString()}",
            "amount":"${event.params.amount.toString()}"
        }`
    )
}

export function handleRewardClaimed(event: RewardClaimed): void {
    createActivity(
        event,
        'REWARD_CLAIMED',
        `{
            "tokenId":"${event.params.tokenId.toString()}",
            "tokenURI":"${event.params.tokenURI}"
        }`
    )
}