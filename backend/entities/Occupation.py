from entities.BaseEntity import BaseEntity


class Occupation(BaseEntity):
    TABLE_NAME = "occupations"
    FIELDS = [
        "id", 
        "name"
    ]

    ARTIST_OCCUPATIONS = ["sculptor","painter","writer","printmaker","photographer","cartoonist",
                    "ceramicist","muralist","miniaturist", "installation artist","musician","multimedia artist",
                    "visual artist","poet","novelist","performance artist","video artist","playwright","actor","screenwriter","composer", "dancer",
                    "actress","singer","film director","ukiyo-e artist","draftsperson"]

    OTHER_OCCUPATIONS = ["king","fashion designer","industrial designer","architect","craftsman","textile artist","draftsman",
                        "instrument maker","graphic designer", "vase painter","photojournalist","inventor","caricaturist",
                        "art director","poet","illustrator","calligrapher","art historian","curator","storyteller","university teacher",
                        "jewelry designer","set designer","typographer","conservationist","physician","chemist","inventor","explorer",
                        "mathematician","anthropologist","ethnologist","cartographer","archaeologist","philologist","linguist","neurologist",
                        "philosopher","astrophysicist","physicist","nobel laureate", "geologist","biologist","naturalist","computer scientist","biophysicist","paleontologist",
                        "psychologist","sociologist","zoologist","economist","diplomat","activist","environmentalist","theologian","astronomist",
                        "journalist","politician","philanthropist", "revolutionary","producer","entrepreneur","lawyer","businessperson",]
    GENERAL_OCCUPATIONS = [
                        "director","designer","historian","artist","scientist","engineer","educator","researcher"
                    ]

    TO_CHANGE = {
        "drawer":"draftsperson",
        "etcher":"printmaker",
        "engraver":"printmaker",
        "lithographer":"printmaker",
        "pianist":"musician",
        "jazz trumpeter":"musician",
        "bassist":"musician",
        "violinist":"musician",
        "cellist":"musician",
        "conductor":"musician",
        "drummer":"musician",
        "guitarist":"musician",
        "saxophonist":"musician",
        "harpist":"musician",
        "flutist":"musician",
        "potter":"ceramicist",
        "ceramist":"ceramicist",
        "cabinet-maker":"craftsman",
        "cabinetmaker":"craftsman",
        "furniture maker":"craftsman",
        "quiltmaker":"textile artist",
        "clockmaker":"craftsman",
        "watchmaker":"craftsman",
        "medallist":"craftsman",
        "medallic artist":"craftsman",
        "comic book artist":"cartoonist",
        "comic artist":"cartoonist",
        "swordsmith":"craftsman",
        "blade smith":"craftsman",
        "blade-smith":"craftsman",
        "silversmith":"craftsman",
        "goldsmith":"craftsman",
        "gunsmith":"craftsman",
        "armourer":"craftsman",
        "armor maker":"craftsman",
        "luthier":"instrument maker",
        "violin maker":"instrument maker",
        "bow maker":"instrument maker",
        "Trumpet maker":"instrument maker",
        "filmmaker":"film director",
        "movie director":"film director",
        "author":"writer",
        "harphs maker":"instrument maker",
        "piano maker":"instrument maker",
        "harp maker":"instrument maker",
        "organ builder":"instrument maker",
        "guitar maker":"instrument maker",
        "businessman":"businessperson",
        "businesswoman":"businessperson",
        "co-founder":"entrepreneur",
        "badminton player":"sportsperson",
        "tennis player":"sportsperson",
        "cricketer":"sportsperson",
        "swimmer":"sportsperson",
        "runner":"sportsperson",
        "athlete":"sportsperson",
        "volleyball player":"sportsperson",
        "basketball player":"sportsperson",
        "baseball player":"sportsperson",
        "cyclist":"sportsperson",
        "football player":"sportsperson",
        "footballer":"sportsperson",
        "soccer player":"sportsperson",
        "boxer":"sportsperson",}   
    
    
